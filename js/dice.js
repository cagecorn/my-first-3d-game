export const DicePools = {
    monsters: [
        "Goblin", "Orc", "Skeleton", "Slime", "Wolf", "Bandit",
        "Dark Mage", "Giant Spider", "Ghost", "Zombie"
    ],
    locations: [
        "Murky Swamp", "Ancient Ruins", "Dense Forest", "Dark Cave",
        "Abandoned Castle", "Foggy Graveyard", "Mountain Pass", "Underground Tunnel"
    ],
    ambience: [
        "ominous", "silent", "chaotic", "peaceful", "terrifying",
        "mysterious", "damp", "cold", "burning"
    ],
    adjectives: [
        "furious", "sneaky", "sleeping", "wounded", "giant",
        "tiny", "shadowy", "cursed"
    ],
    times: [
        "Midnight", "Twilight", "Dawn", "Noon", "Pitch Black"
    ]
};

export const PageTemplates = {
    AMBUSH: {
        type: 'battle',
        templateId: 'ambush',
        requiredDice: ['monsters', 'locations', 'adjectives'],
        prompt: "Describe a sudden ambush by a {adjectives} {monsters} in a {locations}. The party is caught off guard. Keep it brief and dramatic."
    },
    DISCOVERY: {
        type: 'treasure',
        templateId: 'discovery',
        requiredDice: ['locations', 'ambience'],
        prompt: "Describe the party finding a hidden treasure chest in a {locations}. The atmosphere is {ambience}. Keep it brief."
    },
    REST: {
        type: 'rest',
        templateId: 'rest',
        requiredDice: ['locations', 'times'],
        prompt: "The party finds a safe spot to rest in a {locations} at {times}. Describe the peaceful moment. Keep it brief."
    },
    STORY: {
        type: 'story',
        templateId: 'story',
        requiredDice: ['locations', 'ambience'],
        prompt: "Describe the party walking through a {locations}. The atmosphere is {ambience}. Nothing attacks them, but the tension is high. Keep it brief."
    }
};

export class WordDice {
    constructor() {
        this.pools = DicePools;
    }

    roll(poolName) {
        const pool = this.pools[poolName];
        if (!pool) {
            console.error(`Dice pool '${poolName}' not found.`);
            return "???";
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    rollForTemplate(template) {
        const result = {};
        template.requiredDice.forEach(poolName => {
            result[poolName] = this.roll(poolName);
        });
        return result;
    }
}
