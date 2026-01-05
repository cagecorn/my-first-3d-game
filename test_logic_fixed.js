
import { WordDice, PageTemplates } from './js/dice.js';
import { CombatManager } from './js/combat.js';
import { Character } from './js/character.js';
import { Party } from './js/party.js';

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.performance = { now: () => Date.now() };

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
// We manually test update logic to avoid async complexity in this simple script
hero.ap = 0;
combat.update(1.0); // Simulate 1 second

console.log('Hero AP after 1s (Speed 10):', hero.ap);

// Formula in combat.js: apGain = spd * 5 * deltaTime
// 10 * 5 * 1 = 50 AP.
if (hero.ap >= 49 && hero.ap <= 51) {
    console.log('PASS: AP increased correctly');
} else {
    console.error('FAIL: AP calculation wrong. Expected ~50, got ' + hero.ap);
    process.exit(1);
}

console.log('\nAll Tests Passed');
