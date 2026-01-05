
import { Book } from './js/book.js';
import { ItemFactory, ItemType } from './js/item.js';
import { PagePrefixes, PageBases, PageSuffixes } from './js/data/procedural_data.js';

// Mock AI Manager
const mockAIManager = {
    generateStory: async () => "Story text",
    generateStoryFromProcedural: async () => "Procedural story text",
    setApiKey: () => {}
};

async function testPageGeneration() {
    console.log("--- Testing Procedural Page Generation ---");
    const book = new Book(mockAIManager);

    // Force some generations
    for (let i = 0; i < 5; i++) {
        const page = await book.generateNextPage();
        console.log(`Page ${i}: ${page.title}`);
        console.log(` - Type: ${page.type}`);
        console.log(` - Weight: ${page.weight}`);
        console.log(` - Modifiers: P=[${page.modifiers.prefix?.name}] B=[${page.modifiers.base.name}] S=[${page.modifiers.suffix?.name}]`);

        // Test Loot Generation
        const loot = ItemFactory.createLootFromPage(page);
        console.log(` - Loot: ${loot.name} (${loot.value}) - ${loot.description}`);
    }
}

testPageGeneration().then(() => console.log("Done."));
