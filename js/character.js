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
            luk: 10, // Luck: Crit rate, Drop rate
            weight: 50 // New: Determines Initiative (Lower is faster)
        };

        // Derived Stats (Calculated from Base Stats)
        this.maxHp = 0;
        this.hp = 0;
        this.maxMp = 0;
        this.mp = 0;
        this.stamina = 100; // New: Physical/Mental energy for aesthetic logic
        this.atk = 0;
        this.def = 0;
        this.spd = 0;

        // Combat positioning
        this.zone = "Front"; // 'Front' or 'Back'

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

        // New: Skill Cards & Instinct
        this.skillCards = [];
        this.instinct = null; // { Name, Trigger, Effect, Desc }

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

    // --- Combat System Methods (New) ---
    getInitiative() {
        // Lower weight = Higher Initiative
        // Add random variance (1-20)
        return (100 - this.stats.weight) + (Math.floor(Math.random() * 20) + 1);
    }

    isInsane() {
        return this.hilbertSpace.sanity < 20;
    }

    // Load from Preset Data (Helper)
    loadPreset(data) {
        this.name = data.Name || this.name;
        this.id = data.ID || this.id;
        this.jobClass = data.Class || this.jobClass;
        this.zone = data.Zone || "Front";

        // Map Stats (Capitalized in JSON to lowercase)
        if (data.Stats) {
            this.stats.str = data.Stats.STR || this.stats.str;
            this.stats.dex = data.Stats.DEX || this.stats.dex;
            this.stats.int = data.Stats.INT || this.stats.int;
            this.stats.vit = data.Stats.VIT || this.stats.vit;
            this.stats.luk = data.Stats.LUK || this.stats.luk;
            this.stats.weight = data.Stats.Weight || this.stats.weight;

            this.maxHp = data.Stats.MaxHP || this.maxHp;
            this.hp = data.Stats.HP || this.hp;
            this.hilbertSpace.libidoLevel = data.Stats.Libido || 0;
            this.hilbertSpace.sanity = data.Stats.Sanity || 100;
        }

        if (data.Instinct) this.instinct = { ...data.Instinct };
        if (data.Skill_Cards) this.skillCards = JSON.parse(JSON.stringify(data.Skill_Cards));
        if (data.Visual_Tags) this.identity.visualTags.custom = data.Visual_Tags;

        if (data.MBTI) this.setMBTI(data.MBTI);

        this.recalculateStats(); // Recalc derived stats (ATK, DEF etc)

        // Fix for Fixed HP presets: Overwrite maxHp/hp if they were set in Stats
        // recalculateStats uses Formula (VIT * 10), but preset data has explicit balance.
        if (data.Stats && data.Stats.MaxHP) {
            this.maxHp = data.Stats.MaxHP;
        }
        if (data.Stats && data.Stats.HP) {
             this.hp = data.Stats.HP;
        } else {
             this.hp = this.maxHp;
        }
    }

    // --- MBTI System Methods ---
    setMBTI(stats) {
        // Support both old format (E, S, T, J keys) and new format (EI_Val etc)
        if (stats.E !== undefined) this.mbtiDynamic.EI_Val = stats.E; // Now 0-100 direct
        if (stats.S !== undefined) this.mbtiDynamic.SN_Val = stats.S;
        if (stats.T !== undefined) this.mbtiDynamic.TF_Val = stats.T;
        if (stats.J !== undefined) this.mbtiDynamic.JP_Val = stats.J;

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

    // --- JS Translator 1.0 : Logic to Tags ---
    getNarrativeTags(targetId = null) {
        let tags = [];
        let instructions = [];

        // 1. MBTI Spectrum
        const { EI_Val, SN_Val, TF_Val } = this.mbtiDynamic;

        // I > 80 (Extreme Introversion/Vigilance) -> EI_Val < 20
        if (EI_Val < 20) {
             tags.push("Extreme_Vigilance", "Weapon_Grip");
             instructions.push("Action: Silent, gripping weapon. Eyes full of vigilance.");
        }

        // S > 80 (Extreme Sensing) -> SN_Val > 80
        if (SN_Val > 80) {
             tags.push("Hyper_Detail", "Olfactory_Tactile");
             instructions.push("Focus: Physical observation (sweat smell, sound of armor).");
        }

        // N > 80 (Extreme Intuition) -> SN_Val < 20
        if (SN_Val < 20) {
             tags.push("Omen_Reading", "Abstract_Dread");
             instructions.push("Focus: Ominous atmosphere, premonition of death.");
        }

        // T > 70 (Thinking) -> TF_Val > 70
        if (TF_Val > 70) {
             tags.push("Calm_Analysis");
             instructions.push("Tone: Dry, Cynical. Analyze situation with numbers/efficiency.");
        }

        // F > 70 (Feeling) -> TF_Val < 30
        if (TF_Val < 30) {
             tags.push("Visceral_Pain");
             instructions.push("Tone: Desperate. React as if your own flesh is torn.");
        }

        // 2. Libido & Mental
        const { libidoLevel, sanity } = this.hilbertSpace;

        if (libidoLevel < 30) {
             tags.push("Ascetic_Knight");
             instructions.push("Breath: Steady. Stoic posture.");
        } else if (libidoLevel >= 31 && libidoLevel <= 70) {
             tags.push("Suppressed_Heat");
             instructions.push("Breath: Heavy. Feeling hot inside armor.");
        } else if (libidoLevel > 90) {
             tags.push("Rut_Mode", "Non_Consensual_Touch");
             instructions.push("State: Beast-like. Panting. Dilated pupils.");
        }

        if (sanity < 20) {
             tags.push("Beautiful_Madness", "Hysterical_Laugh");
             instructions.push("Laugh: Hysterical. Finds gore beautiful.");
        }

        // 3. Aesthetic / Combat
        // Stamina < 40
        if (this.stamina < 40) {
             tags.push("Oiled_Sweat", "Bulging_Veins");
             instructions.push("Visual: Sweat glistening on skin. Veins popping.");
        }

        // Armor Durability (Simulated with HP or Equipment check)
        const armor = this.equipment.armor;
        if (armor && armor.durability !== undefined && armor.durability < 50) {
             tags.push("Partial_Nudity", "Anatomy_Study");
             instructions.push("Visual: Broken armor revealing muscles. Artistic nudity.");
        } else if (this.hp < (this.maxHp * 0.5)) {
             // Fallback if no specific durability tracking
             tags.push("Battle_Damaged", "Anatomy_Focus");
             instructions.push("Visual: Wounds and damaged gear revealing anatomy.");
        }

        // 4. Relationships (Power & Jealousy)
        if (targetId && this.hilbertSpace.relationships[targetId]) {
             const rel = this.hilbertSpace.relationships[targetId];

             if (rel.dominance > 80) {
                  tags.push("Master_Slave", "Command_Action");
                  instructions.push("Dynamic: Assertive, commanding. Chin lifting.");
             }

             if (rel.jealousy > 80) {
                  tags.push("Possessive", "Intervention");
                  instructions.push("Action: Intervene. Force attention on self.");
             }
        }

        return {
             Tags: tags.join(", "),
             Instructions: instructions.join(" ")
        };
    }

    // --- AI Context Manager ("Middle Manager") ---
    getAIContext(contextType, targetId = null) {
        // Base identity is always relevant
        const baseContext = {
            ID: this.id,
            Identity: this.identity
        };

        // Run Logic Translator
        const narrativeTags = this.getNarrativeTags(targetId);

        if (contextType === "COMBAT") {
            return {
                ...baseContext,
                Combat_Stats: {
                    HP: `${this.hp}/${this.maxHp}`,
                    MP: `${this.mp}/${this.maxMp}`,
                    Stamina: this.stamina,
                    Status: this.combatStatus.statusEffects,
                    LimitGauge: this.combatStatus.limitBreakGauge
                },
                // Combat behavior is driven by MBTI
                Behavior_Engine: this.mbtiDynamic,
                Narrative_Guidance: narrativeTags
            };
        } else if (contextType === "EVENT" || contextType === "SOCIAL") {
            return {
                ...baseContext,
                Personality_State: this.mbtiDynamic,
                Emotional_Space: this.hilbertSpace,
                Aesthetic_State: this.aestheticState,
                Narrative_Guidance: narrativeTags
            };
        } else if (contextType === "VISUAL" || contextType === "IMAGE_GEN") {
             return {
                ...baseContext,
                Aesthetic_State: this.aestheticState,
                Visual_Tags: narrativeTags.Tags
             };
        }

        // Default: Full Dump (for debugging or generic uses)
        return {
            ...baseContext,
            MBTI: this.mbtiDynamic,
            Hilbert: this.hilbertSpace,
            Aesthetic: this.aestheticState,
            Combat: { HP: this.hp, MP: this.mp, Stamina: this.stamina },
            Narrative_Guidance: narrativeTags
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
            combatStatus: { ...this.combatStatus },
            instinct: this.instinct,
            skillCards: this.skillCards,
            zone: this.zone
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

        // New Fields
        if (data.instinct) char.instinct = data.instinct;
        if (data.skillCards) char.skillCards = data.skillCards;
        if (data.zone) char.zone = data.zone;

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
        // Base stats from 'stats' object
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

        // Reduce Stamina on hit (stress)
        this.stamina = Math.max(0, this.stamina - 5);

        // Reduce Armor Durability if present
        if (this.equipment.armor && this.equipment.armor.durability !== undefined) {
            this.equipment.armor.durability = Math.max(0, this.equipment.armor.durability - Math.floor(damage / 2));
        }

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
