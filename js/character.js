export class Character {
    constructor(name, jobClass) {
        this.name = name;
        this.jobClass = jobClass;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;

        // Base Stats (AAA style)
        this.stats = {
            str: 10, // Strength: Physical damage
            dex: 10, // Dexterity: Hit rate, Evasion, Turn speed
            int: 10, // Intelligence: Magic damage, MP
            vit: 10, // Vitality: HP, Defense
            luk: 10  // Luck: Crit rate, Drop rate
        };

        // Derived Stats (Calculated from Base Stats)
        this.maxHp = 0;
        this.hp = 0;
        this.maxMp = 0;
        this.mp = 0;
        this.atk = 0;
        this.def = 0;
        this.spd = 0;

        // Inventory
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };

        this.applyClassModifiers();
        this.recalculateStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        // Memory System
        this.memory_tags = {
            traits: [],
            titles: [],
            relationships: []
        };
    }

    // --- Memory System Methods ---
    addTag(category, tag) {
        if (this.memory_tags[category] && !this.memory_tags[category].includes(tag)) {
            this.memory_tags[category].push(tag);
        }
    }

    removeTag(category, tag) {
        if (this.memory_tags[category]) {
            this.memory_tags[category] = this.memory_tags[category].filter(t => t !== tag);
        }
    }

    hasTag(category, tag) {
        return this.memory_tags[category] && this.memory_tags[category].includes(tag);
    }

    // --- Serialization ---
    getData() {
        return {
            name: this.name,
            jobClass: this.jobClass,
            level: this.level,
            exp: this.exp,
            maxExp: this.maxExp,
            stats: { ...this.stats },
            hp: this.hp,
            mp: this.mp,
            equipment: { ...this.equipment }, // Deep copy if needed, but simple objects are fine
            memory_tags: JSON.parse(JSON.stringify(this.memory_tags)) // Deep copy
        };
    }

    static fromData(data) {
        const char = new Character(data.name, data.jobClass);
        char.level = data.level;
        char.exp = data.exp;
        char.maxExp = data.maxExp;
        char.stats = { ...data.stats };
        char.hp = data.hp;
        char.mp = data.mp;
        char.equipment = { ...data.equipment };
        char.memory_tags = data.memory_tags || { traits: [], titles: [], relationships: [] };

        char.recalculateStats();
        // Recalculate overwrites maxHp/maxMp, but we might want to preserve current HP if it's lower.
        // Or if we load, we assume correct state.
        // Actually, recalculateStats uses vit/int to set maxHp/maxMp.
        // If data.hp > new maxHp, clamp it.
        // But let's assume loaded data is consistent.

        return char;
    }

    applyClassModifiers() {
        // Simple class presets
        switch (this.jobClass) {
            case 'Warrior':
                this.stats.str += 5;
                this.stats.vit += 5;
                break;
            case 'Mage':
                this.stats.int += 8;
                this.stats.luk += 2;
                break;
            case 'Rogue':
                this.stats.dex += 7;
                this.stats.luk += 3;
                break;
            case 'Cleric':
                this.stats.int += 4;
                this.stats.vit += 4;
                this.stats.str += 2;
                break;
        }
    }

    recalculateStats() {
        this.maxHp = this.stats.vit * 10 + this.level * 20;
        this.maxMp = this.stats.int * 5 + this.level * 10;
        this.atk = this.stats.str * 2; // Simplified
        this.def = this.stats.vit * 1;
        this.spd = this.stats.dex * 1.5;

        // Add equipment bonuses here later
        if (this.equipment.weapon) {
            this.atk += this.equipment.weapon.value;
        }
        if (this.equipment.armor) {
            this.def += this.equipment.armor.value;
        }
    }

    equipItem(item) {
        if (!item) return null;

        let oldItem = null;
        if (item.type === 'weapon') {
            oldItem = this.equipment.weapon;
            this.equipment.weapon = item;
        } else if (item.type === 'armor') {
            oldItem = this.equipment.armor;
            this.equipment.armor = item;
        }

        this.recalculateStats();
        return oldItem;
    }

    unequipItem(slot) {
        let oldItem = null;
        if (this.equipment[slot]) {
            oldItem = this.equipment[slot];
            this.equipment[slot] = null;
            this.recalculateStats();
        }
        return oldItem;
    }

    takeDamage(amount) {
        const damage = Math.max(1, amount - this.def);
        this.hp = Math.max(0, this.hp - damage);
        return damage;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    isAlive() {
        return this.hp > 0;
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.2);

        // Auto stat growth
        this.stats.str += 1;
        this.stats.dex += 1;
        this.stats.int += 1;
        this.stats.vit += 1;
        this.stats.luk += 1;

        this.recalculateStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        return true; // Level up happened
    }
}
