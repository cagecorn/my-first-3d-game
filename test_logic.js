
import { WordDice, PageTemplates } from './js/dice.js';
import { CombatManager } from './js/combat.js';
import { Character } from './js/character.js';
import { Party } from './js/party.js';

// Test WordDice
console.log('--- Testing Word Dice ---');
const dice = new WordDice();
const template = PageTemplates.AMBUSH;
const keywords = dice.rollForTemplate(template);
console.log('Template:', template.templateId);
console.log('Keywords:', keywords);

if (!keywords.monsters || !keywords.locations) {
    console.error('FAIL: Missing required keywords');
    process.exit(1);
} else {
    console.log('PASS: Word Dice rolled correctly');
}

// Test Combat AP Logic
console.log('\n--- Testing Combat AP ---');
const party = new Party();
const hero = new Character('Hero', 'Warrior');
hero.spd = 10;
party.addMember(hero);

const combat = new CombatManager(party, console.log, () => {}, () => {});
combat.startCombat(1);
combat.stopCombat(); // Stop loop

// Simulate 1 second
console.log('Hero AP before:', hero.ap);
combat.update(1.0); // 1 second delta
console.log('Hero AP after 1s:', hero.ap);

if (hero.ap > 0) {
    console.log('PASS: AP increased');
} else {
    console.error('FAIL: AP did not increase');
    process.exit(1);
}

console.log('\nAll Tests Passed');
