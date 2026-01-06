import { PageTemplates, WordDice } from './dice.js';
import { PagePrefixes, PageBases, PageSuffixes } from './data/procedural_data.js';

// Event types
export const EventType = {
    BATTLE: 'battle',
    TREASURE: 'treasure',
    REST: 'rest',
    STORY: 'story',
    MESSIAH: 'messiah' // [NEW]
};

export class Page {
    constructor(id, type, title, description, choices = [], modifiers = {}, weight = 0) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.choices = choices;
        this.modifiers = modifiers; // { prefix, base, suffix } objects
        this.weight = weight;
    }
}

export class Book {
    constructor(aiManager, blackboard) {
        this.currentPageNumber = 0;
        this.chapter = 1;
        this.dice = new WordDice();
        this.aiManager = aiManager;
        this.blackboard = blackboard;
    }

    async generateNextPage() {
        this.currentPageNumber++;

        // 1. Procedural Generation
        const pageData = this.generateProceduralPageData();

        // 1.5 Update Blackboard
        if (this.blackboard) {
            this.blackboard.setCurrentPage({
                Page_ID: this.currentPageNumber,
                Title: pageData.fullName,
                Prefix: pageData.prefix ? pageData.prefix.name : "",
                Suffix: pageData.suffix ? pageData.suffix.name : "",
                Prefix_Weight: pageData.prefix ? 0.8 : 0.0, // Hardcoded high weight for prefix as requested if present
                Mission: "Explore", // Could be dynamic
                Keywords: pageData.keywords
            });
        }

        // 2. Generate Story via AI
        const storyText = await this.aiManager.generateStoryFromProcedural(pageData);

        let title = pageData.fullName;
        let choices = [];
        let type = pageData.base.type === 'dungeon' || pageData.base.type === 'boss' ? 'battle' : pageData.base.type;

        // Map Base Type to Game Actions
        if (type === 'battle' || type === 'boss') {
            choices = [{ text: "Fight!", action: "startCombat" }];
            this.currentEnemies = pageData.keywords; // Simplified
        } else if (type === 'treasure' || pageData.base.type === 'shop') {
            // Treat shop as treasure for now or add interaction
            choices = [{ text: "Inspect", action: "openChest" }, { text: "Leave", action: "nextPage" }];
        } else if (type === 'rest') {
            choices = [{ text: "Rest (Recover HP/AP)", action: "rest" }, { text: "Continue", action: "nextPage" }];
        } else {
             // Story / Event
            choices = [{ text: "Turn Page", action: "nextPage" }];
        }

        return new Page(
            this.currentPageNumber,
            type,
            title,
            storyText,
            choices,
            { prefix: pageData.prefix, base: pageData.base, suffix: pageData.suffix },
            pageData.totalWeight
        );
    }

    // [NEW] Messiah Page Generator Stub
    async generateMessiahPage(logData) {
         // This will be called by Main when a Messiah Event is triggered
         // logData contains the specific 'Reality Log' content

         const title = "???";
         const description = "The pages of the Grimoire dissolve into static noise... A voice, familiar yet alien, speaks to you directly.";

         // In real implementation, description would come from AI processing logData

         const choices = [
             { text: "Listen...", action: "messiah_listen" }
         ];

         return new Page(
             this.currentPageNumber,
             EventType.MESSIAH,
             title,
             description,
             choices,
             {},
             999 // High weight/importance
         );
    }

    generateProceduralPageData() {
        // 1. Select Base (Always exists)
        const base = PageBases[Math.floor(Math.random() * PageBases.length)];

        // 2. Roll for Prefix (30% chance)
        let prefix = null;
        if (Math.random() < 0.3) {
            prefix = PagePrefixes[Math.floor(Math.random() * PagePrefixes.length)];
        }

        // 3. Roll for Suffix (30% chance)
        let suffix = null;
        if (Math.random() < 0.3) {
            suffix = PageSuffixes[Math.floor(Math.random() * PageSuffixes.length)];
        }

        // 4. Combine Info
        let fullName = base.name;
        let combinedKeywords = [...base.keywords];
        let totalWeight = base.rarity_score;

        if (prefix) {
            fullName = `${prefix.name} ${fullName}`;
            combinedKeywords.push(...prefix.keywords);
            totalWeight += prefix.rarity_score;
        }

        if (suffix) {
            fullName = `${fullName} ${suffix.name}`;
            combinedKeywords.push(...suffix.keywords);
            totalWeight += suffix.rarity_score;
        }

        return {
            prefix: prefix,
            base: base,
            suffix: suffix,
            fullName: fullName,
            keywords: combinedKeywords,
            totalWeight: totalWeight
        };
    }
}
