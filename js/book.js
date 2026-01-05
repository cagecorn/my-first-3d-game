import { PageTemplates, WordDice } from './dice.js';

// Event types
export const EventType = {
    BATTLE: 'battle',
    TREASURE: 'treasure',
    REST: 'rest',
    STORY: 'story'
};

export class Page {
    constructor(id, type, title, description, choices = []) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.choices = choices;
    }
}

export class Book {
    constructor(aiManager) {
        this.currentPageNumber = 0;
        this.chapter = 1;
        this.dice = new WordDice();
        this.aiManager = aiManager;
    }

    async generateNextPage() {
        this.currentPageNumber++;
        const template = this.getRandomTemplate();

        // Roll dice
        const keywords = this.dice.rollForTemplate(template);

        // Generate Story via AI
        const storyText = await this.aiManager.generateStory(template, keywords);

        let title = `Page ${this.currentPageNumber}`;
        let choices = [];
        let type = template.type;

        if (type === 'battle') {
            title = "Encounter!";
            choices = [{ text: "Fight!", action: "startCombat" }];
            // Store enemy info in the page object for the combat manager?
            // For now, let's keep it simple. The combat manager will generate enemies.
            // Ideally, we pass "keywords.monsters" to the combat manager.
            this.currentEnemies = keywords.monsters;
        } else if (type === 'treasure') {
            title = "Discovery";
            choices = [{ text: "Open Chest", action: "openChest" }, { text: "Leave it", action: "nextPage" }];
        } else if (type === 'rest') {
            title = "Rest Site";
            choices = [{ text: "Rest (Recover HP/AP)", action: "rest" }, { text: "Continue", action: "nextPage" }];
        } else {
            title = "Journey";
            choices = [{ text: "Turn Page", action: "nextPage" }];
        }

        return new Page(
            this.currentPageNumber,
            type,
            title,
            storyText,
            choices
        );
    }

    getRandomTemplate() {
        const keys = Object.keys(PageTemplates);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return PageTemplates[randomKey];
    }
}
