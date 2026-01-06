export const Tones = {
    DEFAULT: 'DEFAULT',
    DRAMATIC: 'DRAMATIC',
    EROTIC: 'EROTIC',
    HORROR: 'HORROR'
};

export class Blackboard {
    constructor() {
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

    // --- Debug/Dump ---
    toJSON() {
        return JSON.stringify(this.state, null, 2);
    }
}
