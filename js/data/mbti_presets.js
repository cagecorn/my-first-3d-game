export const MBTI_PRESETS = {
    ISTJ: {
        id: 'istj',
        name: "Valerius",
        baseClass: "Warrior",
        stats: { E: -70, S: 80, T: 60, J: 90 }, // 신중, 현실, 논리, 계획
        traits: ["원칙주의자", "책임감", "보수적"]
    },
    ESTP: {
        id: 'estp',
        name: "Jax",
        baseClass: "Rogue",
        stats: { E: 80, S: 90, T: 70, J: -60 }, // 활동, 현실, 논리, 즉흥
        traits: ["모험가", "도박꾼", "행동파"]
    },
    INFJ: {
        id: 'infj',
        name: "Serena",
        baseClass: "Cleric",
        stats: { E: -60, S: -70, T: -40, J: 70 }, // 내향, 직관, 감정, 계획
        traits: ["예언자", "통찰력", "신비주의"]
    },
    ENTP: {
        id: 'entp',
        name: "Zane",
        baseClass: "Mage",
        stats: { E: 70, S: -60, T: 80, J: -50 }, // 외향, 직관, 논리, 즉흥
        traits: ["발명가", "논쟁광", "괴짜"]
    },
    ISFP: {
        id: 'isfp',
        name: "Elara",
        baseClass: "Rogue",
        stats: { E: -50, S: 60, T: -60, J: -40 }, // 내향, 감각, 감정, 즉흥
        traits: ["예술가", "온화함", "자유"]
    },
    ESTJ: {
        id: 'estj',
        name: "Marcus",
        baseClass: "Warrior",
        stats: { E: 80, S: 70, T: 90, J: 80 }, // 외향, 감각, 논리, 계획
        traits: ["지휘관", "엄격함", "효율적"]
    }
};
