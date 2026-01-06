import { Character } from './character.js';

export class CombatManager {
    constructor(party, onEvent) {
        this.party = party;
        this.enemies = [];
        this.onEvent = onEvent; // (type, data) => void

        this.isRunning = false;
        this.isPaused = false; // New: Logic pause for narrative
        this.lastFrameTime = 0;
        this.animationFrameId = null;

        // Cooldown for narrative events to prevent spam
        this.lastNarrativeTime = 0;
        this.narrativeCooldown = 5000; // 5 seconds
    }

    startCombat(difficultyLevel, modifiers = {}) {
        this.generateEnemies(difficultyLevel, modifiers);

        // Reset AP for everyone
        this.getAllCombatants().forEach(c => {
            c.ap = 0;
            c.maxAp = 100;
        });

        this.onEvent('combat_start', {
            party: this.party.members,
            enemies: this.enemies
        });

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.loop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastFrameTime = performance.now(); // Reset time to avoid huge delta
    }

    stopCombat() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    loop() {
        if (!this.isRunning) return;

        // Loop even if paused, but skip update logic
        this.animationFrameId = requestAnimationFrame(() => this.loop());

        if (this.isPaused) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;

        this.update(deltaTime);

        if (this.checkEndConditions()) {
            this.stopCombat(); // Stop loop
            return;
        }
    }

    update(deltaTime) {
        const combatants = this.getAllCombatants();
        const updates = [];

        combatants.forEach(c => {
            if (c.isAlive()) {
                // AP Growth (Speed modified by 'Frozen' prefix etc if implemented)
                const apGain = c.spd * 5 * deltaTime;
                c.ap += apGain;

                updates.push({ char: c, ap: c.ap, maxAp: c.maxAp });

                if (c.ap >= c.maxAp) {
                    c.ap = 0;
                    this.performAction(c);
                }
            }
        });

        // Emit update event for UI/Visuals
        this.onEvent('combat_update', { updates });
    }

    performAction(actor) {
        if (this.isPaused) return; // Double check

        // Determine targets
        let targets = [];
        let isPlayerSide = this.party.members.includes(actor);

        if (isPlayerSide) {
            targets = this.enemies.filter(e => e.isAlive());
        } else {
            targets = this.party.getAliveMembers();
        }

        if (targets.length === 0) return;

        // Pick random target
        const target = targets[Math.floor(Math.random() * targets.length)];

        // Calculate Logic
        // Crit Chance: 1 Luk = 0.5%
        const critChance = (actor.stats.luk || 10) * 0.5;
        const isCrit = (Math.random() * 100) < critChance;

        let rawDmg = Math.max(1, actor.atk - (target.def * 0.5));
        if (isCrit) rawDmg *= 1.5;

        // Hit Chance (Dex based?) - Simplifying to 100% for now unless dodge

        const actualDmg = target.takeDamage(rawDmg);
        const isKill = !target.isAlive();

        this.onEvent('action', {
            type: 'attack',
            attacker: actor,
            target: target,
            damage: Math.floor(actualDmg),
            isCrit: isCrit
        });

        // Check Narrative Triggers
        this.checkNarrativeTriggers({
            actor, target, actualDmg, isCrit, isKill
        });

        if (isKill) {
            this.onEvent('death', { target: target });
        }
    }

    checkNarrativeTriggers(context) {
        const now = Date.now();
        if (now - this.lastNarrativeTime < this.narrativeCooldown && !context.isKill) {
            return; // Cooldown active, unless it's a kill (always important)
        }

        let triggerType = null;

        if (context.isKill) {
            triggerType = 'KILL';
        } else if (context.isCrit) {
            triggerType = 'CRIT';
        } else if ((context.target.hp / context.target.maxHp) < 0.3 && (context.target.hp + context.actualDmg) / context.target.maxHp >= 0.3) {
            // Target just dropped below 30%
            triggerType = 'CRISIS';
        }

        if (triggerType) {
            this.lastNarrativeTime = now;
            this.onEvent('narrative_event', {
                triggerType,
                attacker: context.actor,
                target: context.target,
                damage: Math.floor(context.actualDmg)
            });
        }
    }

    checkEndConditions() {
        if (this.party.isWipedOut()) {
            this.endCombat(false);
            return true;
        }
        if (this.enemies.filter(e => e.isAlive()).length === 0) {
            this.endCombat(true);
            return true;
        }
        return false;
    }

    getAllCombatants() {
        return [...this.party.members, ...this.enemies];
    }

    generateEnemies(level, modifiers = {}) {
        this.enemies = [];
        const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies

        // Apply Base Modifier Name
        let baseName = "Monster";
        if (modifiers.base) baseName = modifiers.base.keywords[1] || modifiers.base.name; // Try to get a noun like 'goblins'

        // Prefix Logic
        let prefixName = "";
        let statMult = { str: 1, vit: 1, spd: 1 };

        if (modifiers.prefix) {
            prefixName = modifiers.prefix.name;
            const pId = modifiers.prefix.id;

            if (pId === 'heavy') statMult.vit = 2.0;
            if (pId === 'shadow') statMult.str = 1.5;
            if (pId === 'frozen') statMult.spd = 0.5;
            // 'burning' could add on-hit fire, handled via tags ideally
        }

        for (let i = 0; i < enemyCount; i++) {
            const fullName = prefixName ? `${prefixName} ${baseName}` : baseName;
            const enemy = new Character(`${fullName} ${String.fromCharCode(65+i)}`, 'Monster');
            enemy.level = level;

            // Base Stats
            let str = 5 + level * 2;
            let vit = 5 + level * 2;
            let dex = 5 + level;
            let spd = 5 + Math.random() * 5;

            // Apply Multipliers
            enemy.stats.str = str * statMult.str;
            enemy.stats.vit = vit * statMult.vit;
            enemy.stats.dex = dex;
            enemy.spd = spd * statMult.spd;

            enemy.recalculateStats();
            enemy.hp = enemy.maxHp;

            this.enemies.push(enemy);
        }
    }

    endCombat(isWin) {
        this.stopCombat(); // Redundant but safe

        if (isWin) {
            const expReward = 50;
            this.party.members.forEach(m => {
                if (m.isAlive()) m.gainExp(expReward);
            });
        }

        // Delay slightly for effect
        setTimeout(() => {
            this.onEvent('combat_end', { isWin });
        }, 1000);
    }
}
