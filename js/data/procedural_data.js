
// Prefix: Increases difficulty / Environmental hazards
export const PagePrefixes = [
    { id: 'burning', name: 'Burning', effect_type: 'dot_fire', effect_value: 5, keywords: ['fire', 'heat', 'ash'], rarity_score: 5 },
    { id: 'heavy', name: 'Heavy', effect_type: 'stat_boost_hp', effect_value: 2.0, keywords: ['giant', 'thick armor', 'slow'], rarity_score: 5 },
    { id: 'shadow', name: 'Shadow', effect_type: 'stat_boost_atk', effect_value: 1.5, keywords: ['darkness', 'whispers', 'obscure'], rarity_score: 10 },
    { id: 'cursed', name: 'Cursed', effect_type: 'debuff_all', effect_value: -1, keywords: ['curse', 'blood', 'ritual'], rarity_score: 15 },
    { id: 'frozen', name: 'Frozen', effect_type: 'slow', effect_value: 0.5, keywords: ['ice', 'snow', 'cold'], rarity_score: 5 },
    { id: 'ancient', name: 'Ancient', effect_type: 'boss_chance', effect_value: 0.1, keywords: ['runes', 'dust', 'forgotten'], rarity_score: 20 }
];

// Base: Encounter Template / Theme
export const PageBases = [
    // Locations / Themes
    { id: 'bandit_camp', name: 'Bandit Camp', type: 'battle', difficulty: 1, keywords: ['tents', 'camp', 'bandits'], rarity_score: 2 },
    { id: 'goblin_cave', name: 'Goblin Cave', type: 'battle', difficulty: 1, keywords: ['cave', 'goblins', 'bones'], rarity_score: 2 },
    { id: 'ancient_ruin', name: 'Ancient Ruin', type: 'dungeon', difficulty: 2, keywords: ['ruins', 'statues', 'traps'], rarity_score: 10 },
    { id: 'forest_clearing', name: 'Forest Clearing', type: 'rest', difficulty: 0, keywords: ['trees', 'sunlight', 'flowers'], rarity_score: 1 },
    { id: 'dark_tower', name: 'Dark Tower', type: 'boss', difficulty: 3, keywords: ['spires', 'magic', 'throne'], rarity_score: 30 },
    { id: 'merchant_wagon', name: 'Merchant Wagon', type: 'shop', difficulty: 0, keywords: ['wagon', 'goods', 'coin'], rarity_score: 5 }
];

// Suffix: Reward / Special Rule
export const PageSuffixes = [
    { id: 'of_midas', name: 'of Midas', reward_mod: 'gold_x2', keywords: ['gold', 'shine', 'luxury'], rarity_score: 10 },
    { id: 'of_silence', name: 'of Silence', reward_mod: 'magic_forbid', keywords: ['silence', 'mute', 'dampening'], rarity_score: 15 },
    { id: 'of_hoarding', name: 'of Hoarding', reward_mod: 'drop_x2', keywords: ['piles', 'collection', 'chest'], rarity_score: 20 },
    { id: 'of_knowledge', name: 'of Knowledge', reward_mod: 'xp_boost', keywords: ['scrolls', 'books', 'wisdom'], rarity_score: 10 },
    { id: 'of_blood', name: 'of Blood', reward_mod: 'lifesteal', keywords: ['red', 'vitality', 'pulse'], rarity_score: 15 }
];
