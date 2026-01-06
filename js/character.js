export class Character {
    constructor(name, jobClass) {
        this.name = name;
        this.jobClass = jobClass;
        this.id = `${name}_${jobClass}`; // Unique ID

        // 1. Identity & Visuals
        this.identity = {
            charId: this.id,
            jobClass: jobClass,
            baseArchetype: "ISFJ", // Default, should be configurable
            tone: "Solemn", // Default tone
            visualTags: {
                helmet: "Standard Helm",
                body: "Standard Build",
                weapon: "Standard Weapon"
            }
        };

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

        // 5. Combat Status (Extended)
        this.combatStatus = {
            statusEffects: [],
            limitBreakGauge: 0
        };

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

        // 2. MBTI Dynamic Parameters (0 - 100)
        // 0 = Extreme Negative (I, N, F, P)
        // 100 = Extreme Positive (E, S, T, J)
        this.mbtiDynamic = {
            EI_Val: 50, // E vs I
            SN_Val: 50, // S vs N
            TF_Val: 50, // T vs F
            JP_Val: 50  // J vs P
        };
        this.mbti_type = "XXXX";
        this.updateMBTIType();

        // 3. Hilbert Space (Relational & Emotional)
        this.hilbertSpace = {
            loyaltyMessiah: 50,
            libidoLevel: 0,
            sanity: 100,
            relationships: {} // key: targetId, value: { affection, dominance, jealousy }
        };

        // 4. Aesthetic & Posing Variables
        this.aestheticState = {
            muscleTension: 0, // 0-10
            sweatGloss: 0, // 0-10
            exposureLevel: 1, // 1-5
            currentPose: "Neutral",
            lightingRef: "Neutral"
        };
    }

    // --- Identity Methods ---
    setIdentity(data) {
        if (data.visualTags) this.identity.visualTags = { ...this.identity.visualTags, ...data.visualTags };
        if (data.tone) this.identity.tone = data.tone;
        if (data.baseArchetype) this.identity.baseArchetype = data.baseArchetype;
    }

    // --- MBTI System Methods ---
    setMBTI(stats) {
        // Support both old format (E, S, T, J keys) and new format (EI_Val etc)
        if (stats.E !== undefined) this.mbtiDynamic.EI_Val = (stats.E / 2) + 50;
        if (stats.S !== undefined) this.mbtiDynamic.SN_Val = (stats.S / 2) + 50;
        if (stats.T !== undefined) this.mbtiDynamic.TF_Val = (stats.T / 2) + 50;
        if (stats.J !== undefined) this.mbtiDynamic.JP_Val = (stats.J / 2) + 50;

        if (stats.EI_Val !== undefined) this.mbtiDynamic.EI_Val = stats.EI_Val;
        if (stats.SN_Val !== undefined) this.mbtiDynamic.SN_Val = stats.SN_Val;
        if (stats.TF_Val !== undefined) this.mbtiDynamic.TF_Val = stats.TF_Val;
        if (stats.JP_Val !== undefined) this.mbtiDynamic.JP_Val = stats.JP_Val;

        // Clamp values 0-100
        for (let key in this.mbtiDynamic) {
            this.mbtiDynamic[key] = Math.max(0, Math.min(100, this.mbtiDynamic[key]));
        }

        this.updateMBTIType();
    }

    adjustMBTI(axis, amount) {
        // Axis should be EI_Val, SN_Val, etc.
        // Map old axis names if necessary
        const map = { 'E': 'EI_Val', 'I': 'EI_Val', 'S': 'SN_Val', 'N': 'SN_Val', 'T': 'TF_Val', 'F': 'TF_Val', 'J': 'JP_Val', 'P': 'JP_Val' };

        let realAxis = map[axis] || axis;
        if (this.mbtiDynamic.hasOwnProperty(realAxis)) {
            // If axis was negative (I, N, F, P), we might subtract?
            // User implementation details might vary, let's assume 'amount' is signed correctly for the target axis.
            // But wait, adjustMBTI('E', 10) should increase EI_Val. adjustMBTI('I', 10) should DECREASE EI_Val?
            // Old system: adjustMBTI('E', 10) -> E += 10.

            let finalAmount = amount;
            if (['I', 'N', 'F', 'P'].includes(axis)) {
                finalAmount = -amount;
            }

            this.mbtiDynamic[realAxis] = Math.max(0, Math.min(100, this.mbtiDynamic[realAxis] + finalAmount));
            this.updateMBTIType();
        }
    }

    updateMBTIType() {
        const e = this.mbtiDynamic.EI_Val >= 50 ? 'E' : 'I';
        const s = this.mbtiDynamic.SN_Val >= 50 ? 'S' : 'N';
        const t = this.mbtiDynamic.TF_Val >= 50 ? 'T' : 'F';
        const j = this.mbtiDynamic.JP_Val >= 50 ? 'J' : 'P';
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

        // Convert 0-100 to -100 to 100 for calculation logic compatibility
        const valE = (this.mbtiDynamic.EI_Val - 50) * 2;
        const valS = (this.mbtiDynamic.SN_Val - 50) * 2;
        const valT = (this.mbtiDynamic.TF_Val - 50) * 2;
        const valJ = (this.mbtiDynamic.JP_Val - 50) * 2;

        // 2. MBTI Influences

        // E (Extroversion) - Action oriented, bold
        if (valE > 0) {
            if (action === 'startCombat' || action === 'openChest') score += (valE * 0.2);
            if (action === 'flee') score -= (valE * 0.2);
        } else {
            // Introverted - Cautious
            if (action === 'rest' || action === 'observe') score += (Math.abs(valE) * 0.2);
        }

        // S (Sensing) - Practical, Tangible rewards
        if (valS > 0) {
            if (action === 'openChest' || action === 'loot') score += (valS * 0.3);
        } else {
            // Intuition - Curiosity, Unknown
            if (text.includes('investigate') || text.includes('examine')) score += (Math.abs(valS) * 0.3);
        }

        // T (Thinking) - Logical, Calculated risks
        if (valT > 0) {
            if (hpPercent > 0.7 && action === 'startCombat') score += (valT * 0.1);
        } else {
            // Feeling - People oriented, Values
            if (action === 'talk' || action === 'negotiate') score += (Math.abs(valT) * 0.3);
        }

        // J (Judging) - Decisive, orderly
        if (valJ > 0) {
             if (action === 'nextPage') score += (valJ * 0.1);
        }

        // Add some randomness
        score += (Math.random() * 10) - 5;

        return score;
    }

    // --- Hilbert Space Methods ---
    updateRelationship(targetId, change) {
        if (!this.hilbertSpace.relationships[targetId]) {
            this.hilbertSpace.relationships[targetId] = { affection: 50, dominance: 50, jealousy: 0 };
        }
        const rel = this.hilbertSpace.relationships[targetId];
        if (change.affection) rel.affection = Math.max(0, Math.min(100, rel.affection + change.affection));
        if (change.dominance) rel.dominance = Math.max(0, Math.min(100, rel.dominance + change.dominance));
        if (change.jealousy) rel.jealousy = Math.max(0, Math.min(100, rel.jealousy + change.jealousy));
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

    // --- AI Context Manager ("Middle Manager") ---
    getAIContext(contextType) {
        // Base identity is always relevant
        const baseContext = {
            ID: this.id,
            Identity: this.identity
        };

        if (contextType === "COMBAT") {
            return {
                ...baseContext,
                Combat_Stats: {
                    HP: `${this.hp}/${this.maxHp}`,
                    MP: `${this.mp}/${this.maxMp}`,
                    Status: this.combatStatus.statusEffects,
                    LimitGauge: this.combatStatus.limitBreakGauge
                },
                // Combat behavior is driven by MBTI
                Behavior_Engine: this.mbtiDynamic
            };
        } else if (contextType === "EVENT" || contextType === "SOCIAL") {
            return {
                ...baseContext,
                Personality_State: this.mbtiDynamic,
                Emotional_Space: this.hilbertSpace,
                Aesthetic_State: this.aestheticState
            };
        } else if (contextType === "VISUAL" || contextType === "IMAGE_GEN") {
             return {
                ...baseContext,
                Aesthetic_State: this.aestheticState
             };
        }

        // Default: Full Dump (for debugging or generic uses)
        return {
            ...baseContext,
            MBTI: this.mbtiDynamic,
            Hilbert: this.hilbertSpace,
            Aesthetic: this.aestheticState,
            Combat: { HP: this.hp, MP: this.mp }
        };
    }

    // --- Serialization ---
    getData() {
        return {
            name: this.name,
            jobClass: this.jobClass,
            id: this.id,
            level: this.level,
            exp: this.exp,
            maxExp: this.maxExp,
            stats: { ...this.stats },
            hp: this.hp,
            mp: this.mp,
            equipment: { ...this.equipment },
            memory_tags: JSON.parse(JSON.stringify(this.memory_tags)),

            // New Fields
            identity: { ...this.identity },
            mbtiDynamic: { ...this.mbtiDynamic },
            hilbertSpace: JSON.parse(JSON.stringify(this.hilbertSpace)),
            aestheticState: { ...this.aestheticState },
            combatStatus: { ...this.combatStatus }
        };
    }

    static fromData(data) {
        const char = new Character(data.name, data.jobClass);
        if (data.id) char.id = data.id;
        char.level = data.level;
        char.exp = data.exp;
        char.maxExp = data.maxExp;
        char.stats = { ...data.stats };
        char.hp = data.hp;
        char.mp = data.mp;
        char.equipment = { ...data.equipment };
        char.memory_tags = data.memory_tags || { traits: [], titles: [], relationships: [] };

        if (data.mbtiDynamic) char.mbtiDynamic = { ...data.mbtiDynamic };
        else if (data.mbti) char.setMBTI(data.mbti); // Migration from old data

        if (data.identity) char.identity = { ...data.identity };
        if (data.hilbertSpace) char.hilbertSpace = data.hilbertSpace;
        if (data.aestheticState) char.aestheticState = { ...data.aestheticState };
        if (data.combatStatus) char.combatStatus = { ...data.combatStatus };

        char.updateMBTIType();
        char.recalculateStats();

        return char;
    }

    applyClassModifiers() {
        // Simple class presets
        switch (this.jobClass) {
            case 'Warrior':
                this.stats.str += 5;
                this.stats.vit += 5;
                this.identity.visualTags.weapon = "Greatsword";
                this.identity.visualTags.helmet = "Iron Helm";
                this.identity.visualTags.body = "Muscular";
                break;
            case 'Mage':
                this.stats.int += 8;
                this.stats.luk += 2;
                this.identity.visualTags.weapon = "Staff";
                this.identity.visualTags.helmet = "Hood";
                this.identity.visualTags.body = "Slender";
                break;
            case 'Rogue':
                this.stats.dex += 7;
                this.stats.luk += 3;
                this.identity.visualTags.weapon = "Daggers";
                this.identity.visualTags.helmet = "Mask";
                this.identity.visualTags.body = "Agile";
                break;
            case 'Cleric':
                this.stats.int += 4;
                this.stats.vit += 4;
                this.stats.str += 2;
                this.identity.visualTags.weapon = "Mace";
                this.identity.visualTags.helmet = "Circlet";
                this.identity.visualTags.body = "Robust";
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
            // Update visual tags if possible
            this.identity.visualTags.weapon = item.name;
        } else if (item.type === 'armor') {
            oldItem = this.equipment.armor;
            this.equipment.armor = item;
             // Update visual tags if possible
             this.identity.visualTags.body = item.name + " armor";
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

        // Aesthetic update: Sweat and Tension increases with damage
        this.aestheticState.sweatGloss = Math.min(10, this.aestheticState.sweatGloss + 1);
        this.aestheticState.muscleTension = Math.min(10, this.aestheticState.muscleTension + 1);

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
