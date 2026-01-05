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

    async generateStory(template, keywords) {
        if (!this.apiKey) {
            console.warn("No API Key provided, returning fallback text.");
            return this._generateFallbackText(template, keywords);
        }

        let prompt = template.prompt;

        // Replace placeholders with keywords
        for (const [key, value] of Object.entries(keywords)) {
            prompt = prompt.replace(`{${key}}`, value);
        }

        const fullPrompt = `
You are the Dungeon Master of a dark fantasy RPG.
Generate a short, atmospheric description (2-3 sentences) based on the following prompt.
Do not use markdown. Do not add commentary. Just the story text.

Prompt: ${prompt}
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
                return this._generateFallbackText(template, keywords);
            }

            const data = await response.json();
            const textResult = data.candidates[0].content.parts[0].text;
            return textResult.trim();

        } catch (e) {
            console.error("AI Generation failed:", e);
            return this._generateFallbackText(template, keywords);
        }
    }

    _generateFallbackText(template, keywords) {
        // Simple fallback if API fails
        let text = template.prompt;
        for (const [key, value] of Object.entries(keywords)) {
            text = text.replace(`{${key}}`, value);
        }
        return text + " (AI Connection Failed)";
    }

    async generatePartyReaction(partyMembers, pageEvent) {
        if (!this.apiKey) {
            return [];
        }

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
        let memoryTags = "";

        partyMembers.forEach((m, index) => {
            if (index === 0) return; // Skip player (first member)
            statusSummary += `- ${m.name} (${m.jobClass}): HP ${m.hp}/${m.maxHp} (${m.isAlive() ? '생존' : '기절'})\n`;

            // Collect Memory Tags
            if (m.memory_tags) {
                const traits = m.memory_tags.traits.join(", ");
                const titles = m.memory_tags.titles.join(", ");
                const relationships = m.memory_tags.relationships.join(", ");

                if (traits || titles || relationships) {
                    memoryTags += `- ${m.name} 특성: [${traits}] | 칭호: [${titles}] | 관계: [${relationships}]\n`;
                }
            }
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

[캐릭터 기억 및 특성 (이 정보를 바탕으로 롤플레이 스타일을 조정하세요)]
${memoryTags || "없음"}

${statusSummary}

${eventDesc}
`;
    }
}
