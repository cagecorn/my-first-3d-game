import { Character } from './character.js';

// Configuration
const NARRATION_CHANCE = 0.0; // Disabled random chance for normal turns as per user request
const ZONE = {
    ALLY_FRONT: 'Ally_Front',
    ALLY_BACK: 'Ally_Back',
    ENEMY_FRONT: 'Enemy_Front',
    ENEMY_BACK: 'Enemy_Back'
};

function rollDice(sides = 100) {
    return Math.floor(Math.random() * sides) + 1;
}

export class CombatManager {
    constructor(party, onEvent) {
        this.party = party;
        this.enemies = [];
        this.onEvent = onEvent; // (type, data) => void

        this.isRunning = false;
        this.isPaused = false;

        // Narrative Cooldowns
        this.lastNarrativeTime = 0;
        this.narrativeCooldown = 5000;

        // Round & Turn Management
        this.roundQueue = []; // Units ordered by Initiative
        this.currentUnitIndex = 0;

        this.turnDelay = 1000; // ms between turns for pacing
    }

    startCombat(difficultyLevel, modifiers = {}) {
        this.generateEnemies(difficultyLevel, modifiers);

        // [NEW] Encounter Dice (D20)
        const d20 = Math.floor(Math.random() * 20) + 1;
        let encounterStatus = 'Normal';
        let initiativeBonus = 0;

        if (d20 === 1) {
            encounterStatus = 'Ambush'; // Enemies Advantage
            this.enemies.forEach(e => e.stats.weight -= 20); // Faster enemies
        } else if (d20 === 20) {
            encounterStatus = 'Pre-emptive'; // Player Advantage
            this.party.members.forEach(m => m.stats.weight -= 20); // Faster allies
        }

        // Notify Start
        this.onEvent('combat_start', {
            party: this.party.members,
            enemies: this.enemies,
            encounterStatus: encounterStatus,
            encounterRoll: d20
        });

        this.isRunning = true;
        this.isPaused = false;

        // Start Round 1
        this.startRound();
    }

    startRound() {
        if (!this.isRunning) return;

        // 1. Gather all units
        const allUnits = this.getAllCombatants();

        // 2. Check Win/Loss
        if (this.checkEndConditions()) return;

        // 3. Calculate Initiative & Sort
        this.roundQueue = allUnits.filter(u => u.isAlive()).sort((a, b) => {
            return b.getInitiative() - a.getInitiative();
        });

        this.currentUnitIndex = 0;

        // Log Round Start
        this.logSystem(`=== Round Start! Turn Order: ${this.roundQueue.map(u => u.name).join(" > ")} ===`);

        // Execute first turn
        this.nextTurn();
    }

    nextTurn() {
        if (!this.isRunning || this.isPaused) return;

        if (this.currentUnitIndex >= this.roundQueue.length) {
            // End of Round
            this.startRound();
            return;
        }

        const actor = this.roundQueue[this.currentUnitIndex];
        this.currentUnitIndex++;

        if (!actor.isAlive()) {
            // Skip dead units
            this.nextTurn();
            return;
        }

        // Delay for visual pacing
        setTimeout(() => {
            this.executeTurn(actor);
        }, this.turnDelay);
    }

    resume() {
        this.isPaused = false;
        this.nextTurn(); // Continue where we left off
    }

    pause() {
        this.isPaused = true;
    }

    stopCombat() {
        this.isRunning = false;
    }

    executeTurn(actor) {
        if (!actor.isAlive()) {
             this.nextTurn();
             return;
        }

        // Logic: Main Action + Sub Action (simplified to 1 card for now as per v0.1 snippet,
        // but user asked for [1 Main + 1 Sub]. Let's stick to the v0.1 logic provided in the snippet for now which picks *one* card randomly or by logic).
        // Actually the prompt says: "One Main Action, One Sub Action can be done."
        // But the snippet says: "const card = actor.skillCards[Math.floor(Math.random()...)]"
        // I will implement a slightly smarter logic: Try to use Sub Action if condition met, AND Main Action.

        // Filter available cards
        const mainCards = actor.skillCards ? actor.skillCards.filter(c => c.Type === 'Main') : [];
        const subCards = actor.skillCards ? actor.skillCards.filter(c => c.Type === 'Sub') : [];

        let actionsTaken = 0;

        // 1. Sub Action (Optional, Conditional)
        for (const card of subCards) {
            // Check logic
            let shouldUse = false;

            // If explicit condition exists (e.g. "HP < 50%")
            if (card.Condition) {
                 shouldUse = this.evaluateCondition(actor, card.Condition);
            }
            else if (card.Type === 'Sub') {
                 // Default Sub behavior: 30% random usage if no condition
                 shouldUse = Math.random() < 0.3;
            }

            if (shouldUse) {
                this.performCardAction(actor, card);
                actionsTaken++;
                break; // Limit 1 sub action
            }
        }

        // 2. Main Action (Mandatory)
        if (mainCards.length > 0) {
            const card = mainCards[Math.floor(Math.random() * mainCards.length)];
            // Delay main action slightly if sub action was taken
            if (actionsTaken > 0) {
                 setTimeout(() => this.performCardAction(actor, card), 500);
            } else {
                 this.performCardAction(actor, card);
            }
        } else {
            // Fallback Basic Attack
            this.performBasicAttack(actor);
        }

        // Turn End -> Next Turn
        setTimeout(() => this.nextTurn(), 1000);
    }

    performCardAction(actor, card) {
        // Find Target
        const target = this.findTarget(actor, card.Target);
        if (!target) return;

        // Calc Damage / Effect
        let damage = 0;
        let isHeal = false;
        let isBuff = false;

        // Very basic formula evaluator
        if (card.Dmg_Formula) {
            damage = this.evaluateFormula(actor, card.Dmg_Formula);
        } else if (card.Effect) {
            if (card.Effect.includes("Heal")) {
                isHeal = true;
                damage = this.evaluateFormula(actor, "INT * 1.0"); // Default heal
            } else {
                isBuff = true; // Assume other effects are buffs/status
            }
        }

        let isCritical = rollDice(100) > 90; // 10% base crit
        // Instinct: Weakness Scanner
        if (actor.instinct && actor.instinct.Name === "Weakness_Scanner" && target.hp === target.maxHp) {
            isCritical = rollDice(100) > 40; // +50% chance roughly
        }

        if (isCritical && !isHeal && !isBuff) damage = Math.floor(damage * 1.5);

        // Apply
        let instinctTag = null;

        if (isHeal) {
            target.heal(damage);
            this.logSystem(`[Battle] ${actor.name} uses [${card.Name}] -> Heals ${target.name} for ${damage}.`);
            this.onEvent('action', { type: 'heal', attacker: actor, target: target, amount: damage });
        } else if (isBuff) {
            // Apply Buff Logic (Simplified)
            // Parse "Gain_Shield(5)" or "Buff_STR(3)"
            this.logSystem(`[Battle] ${actor.name} uses [${card.Name}] -> Effect: ${card.Effect}`);

            // Visual event only for now
            this.onEvent('action', { type: 'buff', attacker: actor, target: target, effect: card.Effect });

        } else {
            // Damage
            const actualDmg = target.takeDamage(damage);
            this.logSystem(`[Battle] ${actor.name} uses [${card.Name}] -> ${target.name} takes ${actualDmg} dmg.`);

            this.onEvent('action', { type: 'attack', attacker: actor, target: target, damage: actualDmg, isCrit: isCritical });

            // Instinct: Pain Collector
            if (target.instinct && target.instinct.Trigger === 'On_Hurt') {
                 target.def += 1; // Simplify effect application
                 target.hilbertSpace.libidoLevel += 5;
                 instinctTag = target.instinct.Name;
                 this.logSystem(`> [Instinct] ${target.name}'s ${instinctTag} triggered!`);
                 this.onEvent('instinct_trigger', { character: target, instinctName: instinctTag });
            }
        }

        // Trigger Check
        const context = { actor, target, damage, isCritical, instinctTag, isKill: !target.isAlive() };
        this.checkNarrativeTriggers(context);

        if (context.isKill) {
             this.onEvent('death', { target: target });

             // Instinct: Adrenaline Junkie
             if (actor.instinct && actor.instinct.Trigger === 'On_Kill') {
                  actor.hp += 5; // Heal 5
                  this.logSystem(`> [Instinct] ${actor.name}'s Adrenaline_Junkie triggered! Heals 5 HP.`);
                  this.onEvent('instinct_trigger', { character: actor, instinctName: actor.instinct.Name });
             }
        }
    }

    performBasicAttack(actor) {
        // Fallback
        const targets = this.enemies.includes(actor) ? this.party.getAliveMembers() : this.enemies.filter(e => e.isAlive());
        if (targets.length === 0) return;
        const target = targets[0];
        const dmg = Math.max(1, actor.atk - target.def);
        target.takeDamage(dmg);
        this.logSystem(`[Battle] ${actor.name} attacks ${target.name} for ${dmg}.`);
        this.onEvent('action', { type: 'attack', attacker: actor, target: target, damage: dmg });
    }

    findTarget(actor, targetLogic) {
        const enemies = this.getAllCombatants().filter(c => c.isAlive() && (this.enemies.includes(actor) ? this.party.members.includes(c) : this.enemies.includes(c)));
        const allies = this.getAllCombatants().filter(c => c.isAlive() && (this.enemies.includes(actor) ? this.enemies.includes(c) : this.party.members.includes(c)));

        if (!targetLogic) return enemies[0]; // Default

        // Parsing logic
        if (targetLogic.includes("Self")) return actor;

        if (targetLogic.includes("Ally_Lowest_HP")) {
            return allies.sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0];
        }

        if (targetLogic.includes("Enemy")) {
            // Zone Logic
            // Front = Melee preference. Back = Snipe preference.
            const frontEnemies = enemies.filter(e => e.zone === 'Front');
            const backEnemies = enemies.filter(e => e.zone === 'Back');

            if (targetLogic.includes("Front")) {
                // Try Front, then Back
                if (frontEnemies.length > 0) return frontEnemies[Math.floor(Math.random() * frontEnemies.length)];
                return backEnemies[Math.floor(Math.random() * backEnemies.length)]; // Fallback
            }
            else if (targetLogic.includes("Back")) {
                // Try Back, then Front
                if (backEnemies.length > 0) return backEnemies[Math.floor(Math.random() * backEnemies.length)];
                return frontEnemies[Math.floor(Math.random() * frontEnemies.length)]; // Fallback
            }

            // Default Random Enemy
            return enemies[Math.floor(Math.random() * enemies.length)];
        }

        return enemies[0];
    }

    evaluateFormula(actor, formula) {
        // "STR * 1.2"
        try {
            const stats = actor.stats;
            // Create a safe evaluation scope
            const STR = stats.str;
            const DEX = stats.dex;
            const INT = stats.int;
            const VIT = stats.vit;
            const LUK = stats.luk;
            const AGI = stats.dex; // Alias

            // Simple replace and eval (Caution: eval is dangerous generally, but here controlled string)
            // Better to write a parser, but for this task eval is acceptable as we control the inputs
            return eval(formula);
        } catch (e) {
            console.error("Formula error", formula, e);
            return 10;
        }
    }

    evaluateCondition(actor, condition) {
        // "HP < 50%"
        try {
            if (condition.includes("HP < 50%")) {
                return (actor.hp / actor.maxHp) < 0.5;
            }
            if (condition.includes("Target_Low_HP")) {
                // Check if any ally is low
                const allies = this.party.members.filter(m => m.isAlive());
                return allies.some(m => (m.hp / m.maxHp) < 0.3);
            }
            // Add more condition parsers as needed
            return false;
        } catch (e) {
            return false;
        }
    }

    checkNarrativeTriggers(context) {
        const { actor, isCritical, instinctTag, isKill } = context;

        let shouldTrigger = false;
        if (actor.isInsane()) shouldTrigger = true;
        if (isCritical || instinctTag || isKill) shouldTrigger = true;
        // if (Math.random() < NARRATION_CHANCE) shouldTrigger = true; // Disabled for now

        if (shouldTrigger && !this.isPaused) {
             const narrativeData = {
                triggerType: isKill ? 'KILL' : (instinctTag ? 'INSTINCT' : (isCritical ? 'CRIT' : 'FLAVOR')),
                attacker: actor,
                target: context.target,
                damage: context.damage,
                instinctTag: instinctTag
            };

            this.onEvent('narrative_event', narrativeData);
        }
    }

    logSystem(msg) {
        // this.onEvent('log', { text: msg });
        console.log(msg);
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
        const enemyCount = Math.floor(Math.random() * 2) + 1; // 1-2 enemies

        for (let i = 0; i < enemyCount; i++) {
            const enemy = new Character(`Goblin ${String.fromCharCode(65+i)}`, 'Monster');
            enemy.level = level;
            enemy.stats.weight = 20; // Fast
            enemy.stats.str = 5 + level;
            enemy.stats.hp = 15 + level * 5;
            enemy.maxHp = enemy.stats.hp;
            enemy.hp = enemy.maxHp;

            // Mock enemy cards
            enemy.skillCards = [
                { Name: "Rusty_Slash", Type: "Main", Target: "Enemy_Front", Dmg_Formula: "STR * 1.0" }
            ];

            this.enemies.push(enemy);
        }
    }

    endCombat(isWin) {
        this.stopCombat();
        setTimeout(() => {
            this.onEvent('combat_end', { isWin });
        }, 1000);
    }
}
