export const ItemType = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    POTION: 'potion',
    MISC: 'misc'
};

export class Item {
    constructor(name, type, value, description) {
        this.name = name;
        this.type = type; // 'weapon', 'armor', 'potion', 'misc'
        this.value = value; // Atk power, Def power, Heal amount, or Gold value
        this.description = description;
        this.id = Math.random().toString(36).substr(2, 9); // Simple unique ID for inventory tracking
    }
}

export class ItemFactory {
    static createRandomItem() {
        const templates = [
            // Weapons
            { name: "Rusty Sword", type: ItemType.WEAPON, value: 3, desc: "녹슨 검입니다. 없는 것보단 낫습니다." },
            { name: "Oak Staff", type: ItemType.WEAPON, value: 4, desc: "마력을 증폭시키는 지팡이입니다." },
            { name: "Iron Dagger", type: ItemType.WEAPON, value: 3, desc: "날카로운 단검입니다." },
            { name: "Great Axe", type: ItemType.WEAPON, value: 6, desc: "무거운 양손 도끼입니다." },

            // Armors
            { name: "Leather Tunic", type: ItemType.ARMOR, value: 2, desc: "가죽으로 만든 튜닉입니다." },
            { name: "Chainmail", type: ItemType.ARMOR, value: 5, desc: "사슬 갑옷입니다." },
            { name: "Robes", type: ItemType.ARMOR, value: 1, desc: "마법사를 위한 로브입니다." },

            // Potions
            { name: "Health Potion", type: ItemType.POTION, value: 30, desc: "체력을 30 회복합니다." }
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        return new Item(template.name, template.type, template.value, template.desc);
    }

    static createPotion() {
         return new Item("Health Potion", ItemType.POTION, 30, "체력을 30 회복합니다.");
    }

    /**
     * Semantic Materialization Loot System
     * @param {Object} page - The current Page object containing modifiers (prefix, base, suffix)
     * @returns {Item|Array} Generated item(s)
     */
    static createLootFromPage(page) {
        // Fallback if no modifiers
        if (!page.modifiers) return this.createRandomItem();

        const { prefix, base, suffix } = page.modifiers;

        let itemNameParts = [];
        let itemType = ItemType.MISC;
        let itemValue = 0;
        let itemDesc = "An item materialized from the words of this page.";

        // 1. Base Mapping (Theme/Tier) -> Determines Item Type & Base Value
        // Simple mapping based on Base Name or ID
        if (base) {
            if (base.keywords.includes('bandits') || base.keywords.includes('goblins')) {
                // Tier 1 Weapons
                itemType = ItemType.WEAPON;
                itemValue = 5;
                itemNameParts.push(base.name.split(' ')[0]); // "Bandit", "Goblin"
                itemNameParts.push("Dagger");
            } else if (base.keywords.includes('magic') || base.keywords.includes('runes')) {
                // Magic Items
                itemType = ItemType.WEAPON; // or Staff
                itemValue = 8;
                itemNameParts.push("Ancient");
                itemNameParts.push("Staff");
            } else if (base.keywords.includes('cave') || base.keywords.includes('ruins')) {
                // Armor
                itemType = ItemType.ARMOR;
                itemValue = 4;
                itemNameParts.push("Explorer's");
                itemNameParts.push("Tunic");
            } else {
                 itemType = ItemType.MISC;
                 itemValue = 10;
                 itemNameParts.push("Souvenir");
            }
        }

        // 2. Prefix Mapping (Enchantment)
        if (prefix) {
            itemNameParts.unshift(prefix.name); // "Burning Bandit Dagger"
            if (prefix.effect_type === 'dot_fire') {
                itemValue += 3;
                itemDesc += " It is warm to the touch.";
            } else if (prefix.effect_type === 'stat_boost_hp') {
                itemValue += 2; // Maybe defensive value?
                itemDesc += " It feels incredibly heavy.";
            } else if (prefix.effect_type === 'stat_boost_atk') {
                itemValue += 5;
                itemDesc += " It vibrates with power.";
            }
        }

        // 3. Suffix Mapping (Reward Type / Extra)
        // Suffix usually spawns EXTRA items or currencies, handled outside or here?
        // Let's modify the item itself if relevant, or return multiple items.
        // For simplicity, we just modify the item here or return a special "Reward Box"

        // If Suffix is "of Midas", maybe the item is Golden and worth more money?
        if (suffix) {
            if (suffix.id === 'of_midas') {
                itemNameParts.push(suffix.name);
                itemValue *= 2; // Higher value
                itemDesc += " It is made of pure gold.";
            } else if (suffix.id === 'of_blood') {
                itemNameParts.push(suffix.name);
                itemValue += 2;
                itemDesc += " It pulses with a red aura.";
            }
        }

        const finalName = itemNameParts.join(" ");

        return new Item(finalName, itemType, itemValue, itemDesc);
    }
}
