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

        // MBTI System (-100 to 100)
        // E (Extrovert) vs I (Introvert)
        // S (Sensing) vs N (Intuition)
        // T (Thinking) vs F (Feeling)
        // J (Judging) vs P (Perceiving)
        this.mbti = {
            E: 0, // >0: Extroverted, <0: Introverted
            S: 0, // >0: Sensing, <0: Intuition
            T: 0, // >0: Thinking, <0: Feeling
            J: 0  // >0: Judging, <0: Perceiving
        };
        this.mbti_type = "XXXX"; // Derived string
    }

    // --- MBTI System Methods ---
    setMBTI(stats) {
        this.mbti = { ...this.mbti, ...stats };
        this.updateMBTIType();
    }

    adjustMBTI(axis, amount) {
        if (this.mbti.hasOwnProperty(axis)) {
            this.mbti[axis] = Math.max(-100, Math.min(100, this.mbti[axis] + amount));
            this.updateMBTIType();
        }
    }

    updateMBTIType() {
        const e = this.mbti.E >= 0 ? 'E' : 'I';
        const s = this.mbti.S >= 0 ? 'S' : 'N';
        const t = this.mbti.T >= 0 ? 'T' : 'F';
        const j = this.mbti.J >= 0 ? 'J' : 'P';
        this.mbti_type = `${e}${s}${t}${j}`;
    }

    // --- Voting Logic ---
    evaluateChoice(choice, partyState) {
        let score = 0;
        const action = choice.action;
        const text = choice.text.toLowerCase();

        // 1. Survival Check (Universal)
        const hpPercent = this.hp / this.maxHp;
        if (hpPercent < 0.3) {
            // Critical condition
            if (action === 'rest' || action === 'flee' || text.includes('leave')) {
                score += 50;
            } else if (action === 'startCombat' || action === 'fight') {
                score -= 50;
            }
        }

        // 2. MBTI Influences

        // E (Extroversion) - Action oriented, bold
        if (this.mbti.E > 0) {
            if (action === 'startCombat' || action === 'openChest') score += (this.mbti.E * 0.2);
            if (action === 'flee') score -= (this.mbti.E * 0.2);
        } else {
            // Introverted - Cautious
            if (action === 'rest' || action === 'observe') score += (Math.abs(this.mbti.E) * 0.2);
        }

        // S (Sensing) - Practical, Tangible rewards
        if (this.mbti.S > 0) {
            if (action === 'openChest' || action === 'loot') score += (this.mbti.S * 0.3);
        } else {
            // Intuition - Curiosity, Unknown
            if (text.includes('investigate') || text.includes('examine')) score += (Math.abs(this.mbti.S) * 0.3);
        }

        // T (Thinking) - Logical, Calculated risks
        if (this.mbti.T > 0) {
            // If healthy, fight is logical to gain XP/Loot? Maybe.
            // But mostly about resource management.
            if (hpPercent > 0.7 && action === 'startCombat') score += (this.mbti.T * 0.1);
        } else {
            // Feeling - People oriented, Values
            // Hard to map to generic actions without more context, but let's say they prefer avoiding conflict if not necessary?
            if (action === 'talk' || action === 'negotiate') score += (Math.abs(this.mbti.T) * 0.3);
        }

        // J (Judging) - Decisive, orderly
        // Maybe they prefer sticking to the plan or definitive actions?
        if (this.mbti.J > 0) {
             if (action === 'nextPage') score += (this.mbti.J * 0.1); // Moving forward
        }

        // Add some randomness
        score += (Math.random() * 10) - 5;

        return score;
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
            memory_tags: JSON.parse(JSON.stringify(this.memory_tags)), // Deep copy
            mbti: { ...this.mbti }
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
        if (data.mbti) {
            char.setMBTI(data.mbti);
        }

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
