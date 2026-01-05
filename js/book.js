// Event types
export const EventType = {
    BATTLE: 'battle',
    TREASURE: 'treasure',
    REST: 'rest',
    STORY: 'story'
};

export class Page {
    constructor(id, type, title, description, choices = []) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.choices = choices; // Array of { text: string, action: function }
    }
}

export class Book {
    constructor() {
        this.currentPageNumber = 0;
        this.chapter = 1;
    }

    generateNextPage() {
        this.currentPageNumber++;
        const eventType = this.getRandomEventType();

        // Simple random generation logic
        // In a real game, this would be more complex (weighted, dependent on chapter, etc.)
        switch (eventType) {
            case EventType.BATTLE:
                return new Page(
                    this.currentPageNumber,
                    EventType.BATTLE,
                    `페이지 ${this.currentPageNumber}: 위협적인 그림자`,
                    "어두운 곳에서 몬스터들이 나타납니다! 전투를 준비하십시오.",
                    [{ text: "전투 시작", action: "startCombat" }]
                );
            case EventType.TREASURE:
                return new Page(
                    this.currentPageNumber,
                    EventType.TREASURE,
                    `페이지 ${this.currentPageNumber}: 발견`,
                    "낡은 상자가 덩그러니 놓여있습니다.",
                    [{ text: "상자를 연다", action: "openChest" }, { text: "무시하고 지나간다", action: "nextPage" }]
                );
            case EventType.REST:
                return new Page(
                    this.currentPageNumber,
                    EventType.REST,
                    `페이지 ${this.currentPageNumber}: 잠시의 휴식`,
                    "안전해 보이는 공터를 발견했습니다.",
                    [{ text: "휴식을 취한다 (HP/MP 회복)", action: "rest" }, { text: "계속 이동한다", action: "nextPage" }]
                );
            default: // STORY
                return new Page(
                    this.currentPageNumber,
                    EventType.STORY,
                    `페이지 ${this.currentPageNumber}: 고요한 통로`,
                    "특별한 일은 일어나지 않았습니다. 발소리만이 울려 퍼집니다.",
                    [{ text: "다음 페이지로", action: "nextPage" }]
                );
        }
    }

    getRandomEventType() {
        const rand = Math.random();
        if (rand < 0.4) return EventType.BATTLE; // 40% Battle
        if (rand < 0.6) return EventType.TREASURE; // 20% Treasure
        if (rand < 0.7) return EventType.REST; // 10% Rest
        return EventType.STORY; // 30% Nothing/Story
    }
}
