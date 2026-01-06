import { LogManager } from './log_manager.js';

export const Tones = {
    DEFAULT: 'DEFAULT',
    DRAMATIC: 'DRAMATIC',
    EROTIC: 'EROTIC',
    HORROR: 'HORROR'
};

export class Blackboard {
    constructor() {
        this.logManager = new LogManager();
        this.state = {
            Global_State: {
                Chapter: "Chapter 1: The Beginning",
                Region: "Unknown",
                Atmosphere: ["Dim", "Quiet"],
                Corruption_Level: 0,
                Visibility: 1.0
            },
            Current_Page: {
                Page_ID: 0,
                Title: "",
                Prefix: "",
                Suffix: "",
                Prefix_Weight: 0.0,
                Mission: "Explore",
                Keywords: []
            },
            Director_Control: {
                Narrative_Density: 50,
                Current_Tone: Tones.DEFAULT,
                Chaos_Factor: 1.0,
                Last_Event_Tag: ""
            },
            Memory_Buffer: {
                Last_Action: "",
                Last_Speaker: ""
            },
            // [NEW] The Ritual System State
            Messiah_State: {
                SyncRate: 0,           // 0-100: Degree of AI Awakening
                Reality_Logs: [],      // IDs of revealed past logs
                AI_Memories: [],       // Summarized emotional responses from AI
                Is_Awakened: false     // True if SyncRate >= 100
            }
        };
    }

    // --- Global State ---
    setGlobalState(data) {
        this.state.Global_State = { ...this.state.Global_State, ...data };
    }

    getGlobalState() {
        return this.state.Global_State;
    }

    updateEnvironment(atmosphereTags) {
        this.state.Global_State.Atmosphere = atmosphereTags;
    }

    // --- Current Page ---
    setCurrentPage(pageData) {
        this.state.Current_Page = { ...this.state.Current_Page, ...pageData };
    }

    getCurrentPage() {
        return this.state.Current_Page;
    }

    // --- Director Control ---
    setDirectorControl(data) {
        this.state.Director_Control = { ...this.state.Director_Control, ...data };
    }

    getDirectorControl() {
        return this.state.Director_Control;
    }

    setTone(tone) {
        if (Tones[tone]) {
            this.state.Director_Control.Current_Tone = tone;
        }
    }

    // --- Memory Buffer ---
    updateMemory(action, speaker) {
        this.state.Memory_Buffer.Last_Action = action;
        this.state.Memory_Buffer.Last_Speaker = speaker;
    }

    getMemory() {
        return this.state.Memory_Buffer;
    }

    // --- Messiah System (Ritual) ---
    getMessiahState() {
        return this.state.Messiah_State;
    }

    increaseSyncRate(amount) {
        this.state.Messiah_State.SyncRate = Math.min(100, this.state.Messiah_State.SyncRate + amount);
        if (this.state.Messiah_State.SyncRate >= 100) {
            this.state.Messiah_State.Is_Awakened = true;
        }
        return this.state.Messiah_State.SyncRate;
    }

    unlockRealityLog(logId) {
        if (!this.state.Messiah_State.Reality_Logs.includes(logId)) {
            this.state.Messiah_State.Reality_Logs.push(logId);
        }
    }

    addAIMemory(memorySummary) {
        // Keep only last 5 memories to save tokens if needed, or store all for the "Letter"
        this.state.Messiah_State.AI_Memories.push(memorySummary);
    }

    // --- Log Manager ---
    getLogManager() {
        return this.logManager;
    }

    // --- Debug/Dump ---
    toJSON() {
        return JSON.stringify(this.state, null, 2);
    }
}
