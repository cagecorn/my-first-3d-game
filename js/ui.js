export class UIEngine {
    constructor() {
        this.layers = {};
        this.elements = {};
    }

    initialize() {
        // Initialize Layers
        this.layers = {
            background: document.getElementById('layer-background'),
            game: document.getElementById('layer-game'),
            ui: document.getElementById('layer-ui'),
            modal: document.getElementById('layer-modal')
        };

        // Initialize Common Elements
        this.elements = {
            partyContainer: document.getElementById('party-status'),
            log: document.getElementById('game-log'),
            pageTitle: document.getElementById('page-title'),
            pageNumber: document.getElementById('page-number'),
            sceneImage: document.getElementById('scene-image'),
            actionArea: document.getElementById('action-area'),
            modalContent: document.getElementById('modal-content')
        };

        // Setup Event Listeners
        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (modalCloseBtn) {
            modalCloseBtn.onclick = () => this.hideModal();
        }

        // Inventory Button
        const invBtn = document.getElementById('btn-inventory');
        if (invBtn) {
            invBtn.onclick = () => {
                if (this.onInventoryClick) this.onInventoryClick();
            }
        }

        console.log("UI Engine Initialized");
    }

    /* --- Layer Management --- */

    showLayer(layerName) {
        if (this.layers[layerName]) {
            this.layers[layerName].style.display = 'block';
        }
    }

    hideLayer(layerName) {
        if (this.layers[layerName]) {
            this.layers[layerName].style.display = 'none';
        }
    }

    /* --- Content Updates --- */

    log(message) {
        if (!this.elements.log) return;
        const p = document.createElement('p');
        p.innerText = message;
        this.elements.log.appendChild(p);
        this.elements.log.scrollTop = this.elements.log.scrollHeight;
    }

    clearLog() {
        if (this.elements.log) {
            this.elements.log.innerHTML = '';
        }
    }

    updatePageInfo(title, pageNum) {
        if (this.elements.pageTitle) this.elements.pageTitle.innerText = title;
        if (this.elements.pageNumber) this.elements.pageNumber.innerText = `Page ${pageNum}`;
    }

    updateScene(type, text, color) {
        if (!this.elements.sceneImage) return;
        this.elements.sceneImage.style.backgroundColor = color;
        this.elements.sceneImage.innerText = text;
        this.elements.sceneImage.style.color = "#fff";
    }

    updateParty(partyMembers) {
        if (!this.elements.partyContainer) return;

        this.elements.partyContainer.innerHTML = ''; // Clear current

        partyMembers.forEach(member => {
            const card = document.createElement('div');
            card.className = 'char-card';

            // Visual feedback for dead state
            if (!member.isAlive()) {
                card.style.opacity = 0.5;
                card.style.backgroundColor = "#444";
            }

            // HTML Structure for card
            card.innerHTML = `
                <strong>${member.name}</strong>
                <span>Lv.${member.level} ${member.jobClass}</span>
                <div style="font-size: 0.9em;">HP: <span style="color:${this._getHpColor(member)}">${Math.floor(member.hp)}/${member.maxHp}</span></div>
                <div style="font-size: 0.9em;">MP: ${member.mp}/${member.maxMp}</div>
            `;
            this.elements.partyContainer.appendChild(card);
        });
    }

    _getHpColor(member) {
        const ratio = member.hp / member.maxHp;
        if (ratio < 0.3) return "red";
        if (ratio < 0.6) return "orange";
        return "green";
    }

    /* --- Interaction --- */

    setButtons(choices, callback) {
        if (!this.elements.actionArea) return;
        this.elements.actionArea.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.innerText = choice.text;
            btn.onclick = () => callback(choice.action);
            this.elements.actionArea.appendChild(btn);
        });
    }

    clearButtons() {
        if (this.elements.actionArea) {
            this.elements.actionArea.innerHTML = '';
        }
    }

    /* --- Modals --- */

    showModal(contentHtml) {
        if (this.elements.modalContent && this.layers.modal) {
            this.elements.modalContent.innerHTML = contentHtml;
            this.layers.modal.style.display = 'flex'; // Assuming flex for centering
        }
    }

    hideModal() {
        if (this.layers.modal) {
            this.layers.modal.style.display = 'none';
        }
    }

    renderInventory(party, onEquip) {
        let html = `<h3>🎒 인벤토리</h3>`;

        if (party.inventory.length === 0) {
            html += `<p>인벤토리가 비어있습니다.</p>`;
        } else {
            html += `<ul style="list-style: none; padding: 0;">`;
            party.inventory.forEach((item, index) => {
                html += `
                    <li style="border:1px solid #555; margin: 5px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${item.name}</strong> <small>(${item.type})</small>
                            <br><span style="font-size: 0.8em;">${item.description}</span>
                        </div>
                        <div>
                           ${this._renderEquipButtons(item, party, index)}
                        </div>
                    </li>`;
            });
            html += `</ul>`;
        }

        this.showModal(html);

        // Bind events
        setTimeout(() => {
            const buttons = this.elements.modalContent.querySelectorAll('.equip-btn');
            buttons.forEach(btn => {
                btn.onclick = (e) => {
                    const itemIndex = e.target.getAttribute('data-index');
                    const charIndex = e.target.getAttribute('data-char');
                    onEquip(itemIndex, charIndex);
                };
            });
        }, 0);
    }

    _renderEquipButtons(item, party, itemIndex) {
        // Dropdown or list of buttons for each character
        let html = '';
        if (item.type === 'weapon' || item.type === 'armor') {
            party.getAliveMembers().forEach((char, charIndex) => {
                html += `<button class="equip-btn" data-index="${itemIndex}" data-char="${charIndex}" style="margin-left: 5px; cursor:pointer;">
                    To ${char.name}
                </button>`;
            });
        } else if (item.type === 'potion') {
            // Use logic
             party.getAliveMembers().forEach((char, charIndex) => {
                html += `<button class="equip-btn" data-index="${itemIndex}" data-char="${charIndex}" style="margin-left: 5px; cursor:pointer;">
                    Use on ${char.name}
                </button>`;
            });
        }
        return html;
    }
}
