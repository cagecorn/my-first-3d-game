import { PERSONAS } from './config/personas.js';
import { WORLD_LORE, GAME_RULES } from './config/world.js';
import { SYSTEM_PROMPT } from './config/system.js';

export class AIManager {
    constructor() {
        this.apiKey = null;
        this.model = "gemini-1.5-flash";
    }

    setApiKey(key) {
        this.apiKey = key;
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

        const prompt = `
Describe a scene based on these keywords: [${pageData.keywords.join(", ")}].
The location is called "${pageData.fullName}".
Make it sound dangerous but tempting.
${verbosityInstruction}
`;

        return this._callGemini(prompt);
    }

    async generateStory(template, keywords) {
        // Deprecated or fallback for old code
        return this.generateStoryFromProcedural({
            fullName: "Unknown Place",
            keywords: Object.values(keywords),
            totalWeight: 25 // Default to Mid
        });
    }

    async _callGemini(userPrompt) {
         const fullPrompt = `
You are the Dungeon Master of a dark fantasy RPG.
${userPrompt}
Do not use markdown. Do not add commentary. Just the story text.
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
        // Create status summary
        let statusSummary = "현재 파티 상태:\n";
        let memoryTags = "";

        partyMembers.forEach((m, index) => {
            if (index === 0) return; // Skip player (first member)

            // MBTI Integration
            const mbtiInfo = m.mbti_type ? `[MBTI: ${m.mbti_type}]` : "";
            statusSummary += `- ${m.name} (${m.jobClass}) ${mbtiInfo}: HP ${m.hp}/${m.maxHp} (${m.isAlive() ? '생존' : '기절'})\n`;

            // Collect Memory Tags
            if (m.memory_tags) {
                const traits = m.memory_tags.traits.join(", ");
                const titles = m.memory_tags.titles.join(", ");
                const relationships = m.memory_tags.relationships.join(", ");

                if (traits || titles || relationships) {
                    memoryTags += `- ${m.name} 특성: [${traits}] | 칭호: [${titles}] | 관계: [${relationships}]\n`;
                }
            }

            // MBTI Behavioral Hints
            if (m.mbti) {
                let behaviorHint = `  > ${m.name}의 행동 패턴: `;
                if (m.mbti.E > 20) behaviorHint += "적극적이고 대담함. ";
                if (m.mbti.E < -20) behaviorHint += "신중하고 경계함. ";
                if (m.mbti.S > 20) behaviorHint += "현실적이고 관찰함. ";
                if (m.mbti.S < -20) behaviorHint += "직관적이고 상상력이 풍부함. ";
                if (m.mbti.T > 20) behaviorHint += "논리적이고 계산적임. ";
                if (m.mbti.T < -20) behaviorHint += "감정적이고 동료를 챙김. ";
                if (m.mbti.J > 20) behaviorHint += "계획적이고 질서 정연함. ";
                if (m.mbti.J < -20) behaviorHint += "유연하고 즉흥적임. ";
                memoryTags += behaviorHint + "\n";
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
