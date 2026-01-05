export class UIManager {
    constructor() {
        this.logElement = document.getElementById('story-log');
        this.btnTurnPage = document.getElementById('btn-turn-page');
        this.btnInventory = document.getElementById('btn-inventory');
        this.setupLayer = document.getElementById('layer-setup');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.btnStart = document.getElementById('btn-start-game');

        this.onTurnPage = null; // Callback
        this.onInventory = null; // Callback
        this.onStartGame = null; // Callback

        this.bindEvents();
    }

    bindEvents() {
        this.btnStart.addEventListener('click', () => {
            const key = this.apiKeyInput.value.trim();
            if (key) {
                if (this.onStartGame) this.onStartGame(key);
            } else {
                alert("Please enter a valid API Key.");
            }
        });

        this.btnTurnPage.addEventListener('click', () => {
            if (this.onTurnPage) this.onTurnPage();
        });

        this.btnInventory.addEventListener('click', () => {
            if (this.onInventory) this.onInventory();
        });
    }

    // Hide Setup Modal
    hideSetup() {
        this.setupLayer.style.display = 'none';
    }

    // Show Setup Modal (if needed)
    showSetup() {
        this.setupLayer.style.display = 'flex';
    }

    // Add text to the Right Page log
    log(text, type = 'normal') {
        const p = document.createElement('div');
        p.className = `log-entry mb-2 ${type === 'combat' ? 'text-red-800 text-sm' : 'text-gray-800'}`;

        // Simple Markdown parsing or just text
        p.innerHTML = text.replace(/\n/g, '<br>');

        this.logElement.appendChild(p);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }
}
