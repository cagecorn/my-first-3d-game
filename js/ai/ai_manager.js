import { PERSONAS } from './config/personas.js';
import { WORLD_LORE, GAME_RULES } from './config/world.js';
import { SYSTEM_PROMPT } from './config/system.js';

export class AIManager {
    constructor(blackboard = null) {
        this.apiKey = null;
        this.model = "gemini-1.5-flash-001"; // Updated to user memory preference
        this.blackboard = blackboard;
    }

    setApiKey(key) {
        this.apiKey = key ? key.trim() : null;
    }

    async generateStoryFromProcedural(pageData) {
        if (!this.apiKey) {
            console.warn("No API Key provided, returning fallback text.");
            return `You arrive at ${pageData.fullName}. Keywords: ${pageData.keywords.join(", ")}`;
        }

        // Narrative Weight System (Dynamic Verbosity)
        const weight = pageData.totalWeight;
        let verbosityInstruction = "";

        if (weight < 20) {
            verbosityInstruction = "Describe briefly in 1 sentence. Dry tone.";
        } else if (weight >= 20 && weight <= 50) {
            verbosityInstruction = "Describe in 2-3 sentences. Standard adventure tone.";
        } else {
            verbosityInstruction = "Describe lavishly with sensory details. Epic and dramatic tone. No length limit.";
        }

        // Blackboard Context Injection
        let blackboardContext = "";
        if (this.blackboard) {
            const global = this.blackboard.getGlobalState();
            const director = this.blackboard.getDirectorControl();

            blackboardContext = `
[Director's Note]
- Current Chapter: ${global.Chapter}
- Atmosphere: [${global.Atmosphere.join(", ")}]
- Tone: ${director.Current_Tone} (Adjust style accordingly)
- Chaos Factor: ${director.Chaos_Factor} (Higher means more random/unexpected details)
`;
            if (director.Current_Tone === 'EROTIC') {
                verbosityInstruction += " Focus on sensual and tactile details.";
            } else if (director.Current_Tone === 'HORROR') {
                verbosityInstruction += " Focus on unsettling and creepy details.";
            }
        }

        const prompt = `
${blackboardContext}

Describe a scene based on these keywords: [${pageData.keywords.join(", ")}].
The location is called "${pageData.fullName}".
Make it sound dangerous but tempting.
${verbosityInstruction}

Output Language: Korean (Natural webtoon style)
`;

        const result = await this._callGemini(prompt);

        if (this.blackboard && this.blackboard.getLogManager) {
            this.blackboard.getLogManager().addLog({
                Trigger_Event: "Procedural_Story_Generation",
                Active_Variables: {
                    Page_Title: pageData.fullName,
                    Keywords: pageData.keywords,
                    Total_Weight: pageData.totalWeight
                },
                Calculated_Tags: [verbosityInstruction],
                AI_Instruction_Sent: prompt.trim(),
                Final_Output_Text: result
            });
        }

        return result;
    }

    async generateStory(template, keywords) {
        // Deprecated or fallback for old code
        return this.generateStoryFromProcedural({
            fullName: "Unknown Place",
            keywords: Object.values(keywords),
            totalWeight: 25 // Default to Mid
        });
    }

    async generateCombatCommentary(eventData) {
        if (!this.apiKey) return "Combat intensifies...";

        const { triggerType, attacker, target, damage } = eventData;

        let promptType = "";
        if (triggerType === 'KILL') promptType = "Describe a brutal finishing move.";
        else if (triggerType === 'CRIT') promptType = "Describe a powerful critical hit with flair.";
        else if (triggerType === 'CRISIS') promptType = `Describe ${target.name} struggling to stay standing, bleeding heavily.`;

        const prompt = `
        Context: A fantasy battle.
        Action: ${attacker.name} used an attack on ${target.name}. Damage: ${damage}.
        Trigger: ${triggerType}.

        Instruction: ${promptType}
        Keep it very short (1 sentence). Dynamic and visceral.
        Output Language: Korean.
        `;

        return await this._callGemini(prompt);
    }

    async _callGemini(userPrompt) {
         const fullPrompt = `
You are the Dungeon Master of a dark fantasy RPG.
${userPrompt}
Do not use markdown. Do not add commentary. Just the story text.
        `;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                console.error("AI API Error:", response.status, response.statusText);
                console.error("Endpoint:", `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`);
                return "The mist obscures your vision... (AI Error)";
            }

            const data = await response.json();
            const textResult = data.candidates[0].content.parts[0].text;
            return textResult.trim();

        } catch (e) {
            console.error("AI Generation failed:", e);
            return "The mist obscures your vision... (Network Error)";
        }
    }

    async generatePartyReaction(partyMembers, pageEvent) {
        if (!this.apiKey) {
            return [];
        }
        const context = this._buildContext(partyMembers, pageEvent);
        const resultText = await this._callGemini(context);

        if (this.blackboard && this.blackboard.getLogManager) {
             // Extract context data again for logging (or refactor _buildContext to return it)
             // For now, we'll just log what we can easily access.
             this.blackboard.getLogManager().addLog({
                Trigger_Event: "Party_Reaction",
                Active_Variables: {
                    Event_Title: pageEvent.title,
                    Event_Type: pageEvent.type || "Unknown"
                },
                Calculated_Tags: ["Party_Reaction_Logic"],
                AI_Instruction_Sent: context.trim(),
                Final_Output_Text: resultText
            });
        }

        try {
             // Clean up Markdown code blocks if present
            const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch(e) {
            console.error("Failed to parse party reaction JSON", e);
            return [];
        }
    }

    _buildContext(partyMembers, pageEvent) {
        // Blackboard Context
        let blackboardContext = "";
        if (this.blackboard) {
             const global = this.blackboard.getGlobalState();
             const director = this.blackboard.getDirectorControl();
             blackboardContext = `
[World State]
- Chapter: ${global.Chapter}
- Tone: ${director.Current_Tone}
- Chaos: ${director.Chaos_Factor}
`;
        }

        // Use "Middle Manager" Logic: getAIContext('EVENT') for each member
        let characterContexts = [];
        partyMembers.forEach((m, index) => {
            if (index === 0) return; // Skip player (first member)

            // If Character class has getAIContext, use it. Otherwise fallback.
            if (typeof m.getAIContext === 'function') {
                characterContexts.push(m.getAIContext('EVENT'));
            } else {
                // Fallback for older objects if any
                characterContexts.push({
                    name: m.name,
                    jobClass: m.jobClass,
                    hp: `${m.hp}/${m.maxHp}`
                });
            }
        });

        // Event Description
        const eventDesc = `Current Situation [${pageEvent.title}]:\n${pageEvent.description}`;

        return `
${SYSTEM_PROMPT}

${blackboardContext}

[World Lore]
${WORLD_LORE}

[Game Rules]
${GAME_RULES}

[Character Personas]
${JSON.stringify(PERSONAS, null, 2)}

[Active Party Context (JSON Data)]
${JSON.stringify(characterContexts, null, 2)}

${eventDesc}

Generate a JSON response representing the party's reaction.
Ensure all dialogue text is in Korean (Natural webtoon style).
`;
    }
}
