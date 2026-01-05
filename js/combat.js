import { Character } from './character.js';

export class CombatManager {
    constructor(party, onEvent) {
        this.party = party;
        this.enemies = [];
        this.onEvent = onEvent; // (type, data) => void

        this.isRunning = false;
        this.lastFrameTime = 0;
        this.animationFrameId = null;
    }

    startCombat(difficultyLevel, enemyTypeHint) {
        this.generateEnemies(difficultyLevel, enemyTypeHint);

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
        this.lastFrameTime = performance.now();
        this.loop();
    }

    stopCombat() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;

        this.update(deltaTime);

        if (this.checkEndConditions()) {
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    update(deltaTime) {
        const combatants = this.getAllCombatants();
        const updates = [];

        combatants.forEach(c => {
            if (c.isAlive()) {
                // AP Growth
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

        // Calculate Damage
        const rawDmg = Math.max(1, actor.atk - (target.def * 0.5));
        const actualDmg = target.takeDamage(rawDmg);

        this.onEvent('action', {
            type: 'attack',
            attacker: actor,
            target: target,
            damage: Math.floor(actualDmg)
        });

        if (!target.isAlive()) {
            this.onEvent('death', { target: target });
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

    generateEnemies(level, enemyTypeHint) {
        this.enemies = [];
        const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies

        let nameBase = enemyTypeHint || "Monster";

        for (let i = 0; i < enemyCount; i++) {
            const enemy = new Character(`${nameBase} ${String.fromCharCode(65+i)}`, 'Monster');
            enemy.level = level;
            // Scale stats
            enemy.stats.str = 5 + level * 2;
            enemy.stats.vit = 5 + level * 2;
            enemy.stats.dex = 5 + level;
            enemy.spd = 5 + Math.random() * 5;
            enemy.recalculateStats();
            enemy.hp = enemy.maxHp;

            this.enemies.push(enemy);
        }
    }

    endCombat(isWin) {
        this.stopCombat();

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
