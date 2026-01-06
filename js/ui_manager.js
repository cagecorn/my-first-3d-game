export class UIManager {
    constructor() {
        this.logElement = document.getElementById('story-log');
        this.btnTurnPage = document.getElementById('btn-turn-page');
        this.btnInventory = document.getElementById('btn-inventory');
        this.btnDownloadLog = document.getElementById('btn-download-log');
        this.setupLayer = document.getElementById('layer-setup');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.btnStart = document.getElementById('btn-start-game');

        this.onTurnPage = null; // Callback
        this.onInventory = null; // Callback
        this.onStartGame = null; // Callback
        this.onDownloadLog = null; // Callback

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

        if (this.btnDownloadLog) {
            this.btnDownloadLog.addEventListener('click', () => {
                if (this.onDownloadLog) this.onDownloadLog();
            });
        }
    }

    // Hide Setup Modal
    hideSetup() {
        this.setupLayer.style.display = 'none';
    }

    // Show Setup Modal (if needed)
    showSetup() {
        this.setupLayer.style.display = 'flex';
    }

    // Toggle Glitch Effect
    toggleGlitch(active) {
        if (active) {
            document.body.classList.add('glitch-effect');
        } else {
            document.body.classList.remove('glitch-effect');
        }
    }

    // Add text to the Right Page log
    log(text, type = 'normal', character = null) {
        const p = document.createElement('div');
        p.className = `log-entry mb-2 ${type === 'combat' ? 'text-red-800 text-sm' : 'text-gray-800'}`;

        // Container for text to prevent Typewriter from overwriting buttons
        const contentSpan = document.createElement('span');
        p.appendChild(contentSpan);

        // Run Typewriter Effect
        const formattedText = text.replace(/\n/g, '<br>');
        this.typewriterEffect(contentSpan, formattedText);

        // If character provided (AI dialogue), add Approve/Disapprove buttons
        if (character && type === 'normal') { // Assuming normal log is used for dialogue
             const controls = document.createElement('div');
             controls.className = "flex gap-2 mt-1";

             const btnApprove = document.createElement('button');
             btnApprove.innerText = "👍";
             btnApprove.className = "text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded border border-green-300";
             btnApprove.onclick = () => {
                 if (this.onApprove) this.onApprove(character);
                 btnApprove.disabled = true;
                 btnDisapprove.disabled = true;
                 p.classList.add("bg-green-50");
             };

             const btnDisapprove = document.createElement('button');
             btnDisapprove.innerText = "👎";
             btnDisapprove.className = "text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded border border-red-300";
             btnDisapprove.onclick = () => {
                 if (this.onDisapprove) this.onDisapprove(character);
                 btnApprove.disabled = true;
                 btnDisapprove.disabled = true;
                 p.classList.add("bg-red-50");
             };

             controls.appendChild(btnApprove);
             controls.appendChild(btnDisapprove);
             p.appendChild(controls);
        }

        this.logElement.appendChild(p);
        this.scrollToBottom();
    }

    typewriterEffect(element, text, speed = 20) {
        // Regex to split by HTML tags (matches <...> as a token)
        const tokens = text.split(/(<[^>]+>)/g).filter(t => t);

        let tokenIndex = 0;
        let charIndex = 0;

        const type = () => {
            if (tokenIndex >= tokens.length) return;

            const token = tokens[tokenIndex];

            if (token.startsWith('<') && token.endsWith('>')) {
                // It's a tag, append instantly
                element.innerHTML += token;
                tokenIndex++;
                type(); // Immediate next token
            } else {
                // It's text
                if (charIndex < token.length) {
                    element.innerHTML += token.charAt(charIndex);
                    charIndex++;
                    this.scrollToBottom();
                    setTimeout(type, speed);
                } else {
                    // Text token finished
                    tokenIndex++;
                    charIndex = 0;
                    setTimeout(type, speed);
                }
            }
        };

        type();
    }

    scrollToBottom() {
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }
}
