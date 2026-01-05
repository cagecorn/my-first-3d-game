import { Character } from './character.js';

export class CombatManager {
    constructor(party, logCallback, updateUICallback, onCombatEnd) {
        this.party = party;
        this.enemies = [];
        this.log = logCallback;
        this.updateUI = updateUICallback;
        this.onCombatEnd = onCombatEnd;
        this.turnOrder = [];
        this.turnIndex = 0;
        this.combatInterval = null;
    }

    startCombat(difficultyLevel) {
        this.generateEnemies(difficultyLevel);
        this.log(`전투 개시! 적 ${this.enemies.length}마리가 나타났습니다.`);

        // Combine party and enemies for turn order
        this.calculateTurnOrder();

        // Start turn loop
        this.processNextTurn();
    }

    generateEnemies(level) {
        // Simple enemy generation
        const enemyCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 enemies
        for (let i = 0; i < enemyCount; i++) {
            const enemy = new Character(`Monster ${String.fromCharCode(65+i)}`, 'Monster');
            // Adjust stats for enemy
            enemy.level = level;
            enemy.stats.str = 5 + level * 2;
            enemy.stats.vit = 5 + level * 2;
            enemy.stats.dex = 5 + level;
            enemy.recalculateStats();
            enemy.hp = enemy.maxHp;
            this.enemies.push(enemy);
        }
    }

    calculateTurnOrder() {
        const allCombatants = [...this.party.getAliveMembers(), ...this.enemies];
        // Sort by speed (descending)
        this.turnOrder = allCombatants.sort((a, b) => b.spd - a.spd);
        this.turnIndex = 0;
    }

    processNextTurn() {
        // Check win/loss condition
        if (this.party.isWipedOut()) {
            this.endCombat(false);
            return;
        }
        if (this.enemies.filter(e => e.isAlive()).length === 0) {
            this.endCombat(true);
            return;
        }

        const actor = this.turnOrder[this.turnIndex];

        // Skip dead actors
        if (!actor.isAlive()) {
            this.nextTurn();
            return;
        }

        // Action Delay (Simulation feeling)
        setTimeout(() => {
            this.performAction(actor);
        }, 1000); // 1 second per turn
    }

    performAction(actor) {
        // Determine targets
        let targets = [];
        let isPlayerSide = this.party.members.includes(actor);

        if (isPlayerSide) {
            // Player attacks Enemy
            targets = this.enemies.filter(e => e.isAlive());
        } else {
            // Enemy attacks Player
            targets = this.party.getAliveMembers();
        }

        if (targets.length === 0) {
            this.nextTurn();
            return;
        }

        // Pick random target
        const target = targets[Math.floor(Math.random() * targets.length)];

        // Calculate Damage
        // Simple Logic: Atk - Def/2 (Minimum 1)
        const rawDmg = Math.max(1, actor.atk - (target.def * 0.5));
        const actualDmg = target.takeDamage(rawDmg);

        this.log(`${actor.name}의 공격! ${target.name}에게 ${Math.floor(actualDmg)}의 피해!`);

        if (!target.isAlive()) {
            this.log(`${target.name}이(가) 쓰러졌습니다!`);
        }

        this.updateUI(); // Update HP bars
        this.nextTurn();
    }

    nextTurn() {
        this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
        // Recalculate turn order occasionally or just loop?
        // For simplicity, just loop, but remove dead from logic check in processNextTurn
        this.processNextTurn();
    }

    endCombat(isWin) {
        if (isWin) {
            this.log(`전투 승리! 모든 적을 물리쳤습니다.`);
            // Give Rewards
            const expReward = 50; // Flat for now
            this.party.members.forEach(m => {
                if (m.isAlive()) m.gainExp(expReward);
            });
            this.log(`파티원들이 ${expReward} 경험치를 획득했습니다.`);
        } else {
            this.log(`전투 패배... 파티가 전멸했습니다.`);
        }

        setTimeout(() => {
            this.onCombatEnd(isWin);
        }, 2000);
    }
}
