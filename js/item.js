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
}
