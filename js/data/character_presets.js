export const CHARACTER_PRESETS = [
  // 1. 🛡️ 크리스 (Chris) - The Iron Wall
  {
    "ID": "Chris_Warrior",
    "Name": "Chris",
    "Class": "Warrior",
    "Zone": "Front", // 전열 배치
    "Stats": {
      "HP": 40,        // 압도적인 체력 (다른 캐릭의 2배)
      "MaxHP": 40,
      "Weight": 90,    // 매우 무거움 -> 턴이 늦게 옴
      "STR": 6,        // 준수한 힘
      "DEF": 2,        // 기본 방어력 (데미지 감면)
      "Libido": 10,    // [금욕] 상태로 시작
      "Sanity": 100,
      "DEX": 5,        // Added for compatibility
      "INT": 3,
      "VIT": 10,
      "LUK": 5
    },
    "Instinct": {
      "Name": "Pain_Collector",
      "Trigger": "On_Hurt",
      "Effect": { "Buff_DEF": 1, "Libido_Up": 5 },
      "Desc": "피격 시 방어력+1, 리비도+5"
    },
    "Skill_Cards": [
      {
        "Name": "Shield_Bash",
        "Type": "Main",
        "Target": "Enemy_Front_Single",
        "Dmg_Formula": "STR * 0.8", // 데미지 약 4~5
        "Tags": ["Stun", "Blunt"]
      },
      {
        "Name": "Iron_Will",
        "Type": "Sub",
        "Target": "Self",
        "Effect": "Taunt_All + Gain_Shield(5)",
        "Tags": ["Protect", "Roar"]
      }
    ],
    "Visual_Tags": ["Full_Plate_Armor", "T_Visor_Helm", "Giant_Shield"],
    "MBTI": { "E": 20, "S": 80, "T": 40, "J": 80 } // ISFJish
  },

  // 2. 🪓 테온 (Theon) - The Mad Dog
  {
    "ID": "Theon_Barbarian",
    "Name": "Theon",
    "Class": "Barbarian",
    "Zone": "Front",
    "Stats": {
      "HP": 28,
      "MaxHP": 28,
      "Weight": 30,    // 가벼움 -> 턴을 빨리 잡음
      "STR": 8,        // 깡패 같은 공격력
      "DEF": 0,        // 방어따윈 안 함
      "Libido": 40,    // 이미 좀 흥분해 있음
      "Sanity": 90,
      "DEX": 7,
      "INT": 2,
      "VIT": 6,
      "LUK": 5
    },
    "Instinct": {
      "Name": "Adrenaline_Junkie",
      "Trigger": "On_Kill",
      "Effect": { "Action_Point": 1, "Heal": 5 },
      "Desc": "처치 시 추가 행동 + 체력 5 회복"
    },
    "Skill_Cards": [
      {
        "Name": "Cleave", // 쪼개기
        "Type": "Main",
        "Target": "Enemy_Front_Single",
        "Dmg_Formula": "STR * 1.2", // 데미지 약 9~10 (아픔)
        "Tags": ["Bleed", "Slash"]
      },
      {
        "Name": "Blood_Lust",
        "Type": "Sub",
        "Target": "Self",
        "Effect": "Cost_HP(3) + Buff_STR(3)", // 피 깎고 공격력 증가
        "Tags": ["Buff", "Scream"]
      }
    ],
    "Visual_Tags": ["Dual_Axe", "Exposed_Chest", "Wing_Mechanism"],
    "MBTI": { "E": 90, "S": 90, "T": 60, "J": 10 } // ESTP
  },

  // 3. 🔭 바렛 (Barrett) - The Cold Eye
  {
    "ID": "Barrett_Sniper",
    "Name": "Barrett",
    "Class": "Sniper",
    "Zone": "Back", // 후열 배치
    "Stats": {
      "HP": 22,
      "MaxHP": 22,
      "Weight": 50,    // 보통
      "STR": 4,
      "DEX": 9,        // AGI -> DEX mapping
      "DEF": 1,
      "Libido": 20,
      "Sanity": 100,
      "INT": 7,
      "VIT": 4,
      "LUK": 8
    },
    "Instinct": {
      "Name": "Weakness_Scanner",
      "Trigger": "Target_Full_HP",
      "Effect": { "Crit_Rate": 50 }, // % 단위
      "Desc": "체력 100%인 적 공격 시 치명타율 +50%"
    },
    "Skill_Cards": [
      {
        "Name": "AP_Shot", // 철갑탄
        "Type": "Main",
        "Target": "Enemy_Back_Single", // 후열 저격 가능!
        "Dmg_Formula": "DEX * 1.0", // 데미지 9 (방어 무시 속성 부여 가능)
        "Tags": ["Pierce", "Snipe"]
      },
      {
        "Name": "Reload_Tactics",
        "Type": "Sub",
        "Target": "Self",
        "Effect": "Next_Turn_Dmg_x2", // 다음 턴 딜 2배
        "Tags": ["Prepare", "Click_Sound"]
      }
    ],
    "Visual_Tags": ["Heavy_Sniper_Rifle", "Goggles", "Leather_Coat"],
    "MBTI": { "E": 10, "S": 40, "T": 90, "J": 80 } // INTJ
  },

  // 4. 💉 사일러스 (Silas) - The Mad Doctor
  {
    "ID": "Silas_Doctor",
    "Name": "Silas",
    "Class": "Healer",
    "Zone": "Back",
    "Stats": {
      "HP": 20,        // 물몸 (제일 약함)
      "MaxHP": 20,
      "Weight": 45,
      "STR": 3,
      "DEX": 6,
      "INT": 8,        // 지능 (힐량/마법딜)
      "DEF": 0,
      "Libido": 30,
      "Sanity": 70,     // 시작부터 약간 미쳐있음
      "VIT": 3,
      "LUK": 5
    },
    "Instinct": {
      "Name": "Sadistic_Healer",
      "Trigger": "Target_Low_HP", // HP 30% 이하 아군
      "Effect": { "Heal_Bonus": 50, "Libido_Up": 3 },
      "Desc": "위급한 아군 치료 시 힐량 1.5배 + 리비도 증가"
    },
    "Skill_Cards": [
      {
        "Name": "Toxic_Injection",
        "Type": "Main",
        "Target": "Enemy_Front_Single",
        "Dmg_Formula": "INT * 0.5 + 3", // 뎀4 + 독3 (총 7)
        "Tags": ["Poison", "Stab"]
      },
      {
        "Name": "Adrenaline_Shot",
        "Type": "Sub",
        "Target": "Ally_Lowest_HP",
        "Effect": "Heal(INT * 0.8) + Buff_SPD(20)", // 힐 6~7 + 속도 증가
        "Tags": ["Heal", "Drug"]
      }
    ],
    "Visual_Tags": ["Plague_Mask", "Syringe_Gauntlet", "Robes"],
    "MBTI": { "E": 20, "S": 50, "T": 80, "J": 40 } // INTP
  }
];
