/**
 * Base class for LLM Providers
 */
export class BaseLLMProvider {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateContent(prompt) {
        throw new Error("generateContent() must be implemented by subclass");
    }
}

/**
 * Gemini API Provider
 */
export class GeminiProvider extends BaseLLMProvider {
    constructor(apiKey, model = "gemini-2.0-flash") {
        super(apiKey, model);
    }

    async generateContent(prompt) {
        if (!this.apiKey) {
            throw new Error("Gemini API Key missing");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    }
}

/**
 * LM Studio Provider (OpenAI Compatible)
 */
export class LMStudioProvider extends BaseLLMProvider {
    constructor(apiKey = "not-needed", model = "my_final_ai") {
        super(apiKey, model);
        this.baseUrl = "http://localhost:1234/v1/chat/completions";
    }

    async generateContent(prompt) {
        const key = this.apiKey || "not-needed";
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`LM Studio API Error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
}
