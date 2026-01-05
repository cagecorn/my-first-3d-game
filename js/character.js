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
