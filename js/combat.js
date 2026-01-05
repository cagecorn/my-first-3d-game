import { Character } from './character.js';

export class CombatManager {
    constructor(party, logCallback, updateUICallback, onCombatEnd) {
        this.party = party;
        this.enemies = [];
        this.log = logCallback;
        this.updateUI = updateUICallback;
        this.onCombatEnd = onCombatEnd;

        this.isRunning = false;
        this.lastFrameTime = 0;
        this.animationFrameId = null;
    }

    startCombat(difficultyLevel, enemyTypeHint) {
        this.generateEnemies(difficultyLevel, enemyTypeHint);
        this.log(`Combat Started! ${this.enemies.length} enemies appearing.`);

        // Reset AP for everyone
        this.getAllCombatants().forEach(c => {
            c.ap = 0;
            c.maxAp = 100; // Standardize max AP
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

        combatants.forEach(c => {
            if (c.isAlive()) {
                // AP Growth: Speed * Multiplier * DeltaTime
                // Base speed ~ 10. Max AP 100.
                // If Speed 10 -> 10 * 2 * 1s = 20 AP/s -> 5 seconds per turn.
                // Let's tune it.
                const apGain = c.spd * 5 * deltaTime;
                c.ap += apGain;

                if (c.ap >= c.maxAp) {
                    c.ap = 0; // Reset AP
                    this.performAction(c);
                }
            }
        });

        // UI Update (AP bars need to update smoothly)
        this.updateUI();
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

        this.log(`${actor.name} attacks ${target.name} for ${Math.floor(actualDmg)} DMG!`);

        if (!target.isAlive()) {
            this.log(`${target.name} collapses!`);
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
            enemy.spd = 5 + Math.random() * 5; // Random speed
            enemy.recalculateStats();
            enemy.hp = enemy.maxHp;

            this.enemies.push(enemy);
        }
    }

    endCombat(isWin) {
        this.stopCombat();
        if (isWin) {
            this.log(`Victory! Gained XP.`);
            const expReward = 50;
            this.party.members.forEach(m => {
                if (m.isAlive()) m.gainExp(expReward);
            });
        } else {
            this.log(`Defeat...`);
        }

        setTimeout(() => {
            this.onCombatEnd(isWin);
        }, 2000);
    }
}
