import { PERSONAS } from './config/personas.js';
import { WORLD_LORE, GAME_RULES } from './config/world.js';
import { SYSTEM_PROMPT } from './config/system.js';

export class AIManager {
    constructor() {
        this.apiKey = null;
        this.model = "gemini-1.5-flash"; // Or flash-8b if available for speed
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    async generatePartyReaction(partyMembers, pageEvent) {
        if (!this.apiKey) {
            return [];
        }

        // Filter out the Player (Warrior/First member) usually, but logic asks for "Other 3 members".
        // Assuming partyMembers[0] is the player.
        // But let's look at the party array. In main.js: Hero(Warrior), Mage, Rogue, Healer(Cleric).
        // The prompt says "Generate for Mage, Rogue, Cleric".

        // Context Building
        const context = this._buildContext(partyMembers, pageEvent);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: context
                        }]
                    }]
                })
            });

            if (!response.ok) {
                console.error("AI API Error:", response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            const textResult = data.candidates[0].content.parts[0].text;

            // Clean up Markdown code blocks if present
            const jsonStr = textResult.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonStr);

        } catch (e) {
            console.error("AI Generation failed:", e);
            return null;
        }
    }

    _buildContext(partyMembers, pageEvent) {
        // Create status summary
        let statusSummary = "현재 파티 상태:\n";
        partyMembers.forEach((m, index) => {
            if (index === 0) return; // Skip player (first member)
            statusSummary += `- ${m.name} (${m.jobClass}): HP ${m.hp}/${m.maxHp} (${m.isAlive() ? '생존' : '기절'})\n`;
        });

        // Event Description
        const eventDesc = `현재 상황 [${pageEvent.title}]:\n${pageEvent.description}`;

        return `
${SYSTEM_PROMPT}

[세계관]
${WORLD_LORE}

[규칙]
${GAME_RULES}

[캐릭터 페르소나]
${JSON.stringify(PERSONAS, null, 2)}

${statusSummary}

${eventDesc}
`;
    }
}
