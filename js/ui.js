export class UIEngine {
    constructor() {
        this.layers = {};
        this.elements = {};
    }

    initialize() {
        this.layers = {
            background: document.getElementById('layer-background'),
            game: document.getElementById('layer-game'),
            ui: document.getElementById('layer-ui'),
            modal: document.getElementById('layer-modal'),
            setup: document.getElementById('layer-setup')
        };

        this.elements = {
            partyContainer: document.getElementById('party-status'),
            log: document.getElementById('game-log'),
            pageTitle: document.getElementById('page-title'),
            pageNumber: document.getElementById('page-number'),
            sceneImage: document.getElementById('scene-image'),
            actionArea: document.getElementById('action-area'),
            modalContent: document.getElementById('modal-content'),
            apiKeyInput: document.getElementById('api-key-input'),
            btnStartGame: document.getElementById('btn-start-game')
        };

        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (modalCloseBtn) {
            modalCloseBtn.onclick = () => this.hideModal();
        }

        const invBtn = document.getElementById('btn-inventory');
        if (invBtn) {
            invBtn.onclick = () => {
                if (this.onInventoryClick) this.onInventoryClick();
            }
        }
    }

    showLayer(layerName) {
        if (this.layers[layerName]) this.layers[layerName].style.display = 'block';
    }

    hideLayer(layerName) {
        if (this.layers[layerName]) this.layers[layerName].style.display = 'none';
    }

    /* --- Typewriter Log --- */

    log(message) {
        if (!this.elements.log) return;

        // Add new paragraph
        const p = document.createElement('p');
        this.elements.log.appendChild(p);

        // Typewriter effect
        let i = 0;
        const speed = 20; // ms per char

        const typeWriter = () => {
            if (i < message.length) {
                p.textContent += message.charAt(i);
                i++;
                this.elements.log.scrollTop = this.elements.log.scrollHeight;
                setTimeout(typeWriter, speed);
            }
        };
        typeWriter();
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

        this.elements.partyContainer.innerHTML = '';

        partyMembers.forEach(member => {
            const card = document.createElement('div');
            card.className = 'char-card';

            if (!member.isAlive()) {
                card.style.opacity = 0.5;
                card.style.backgroundColor = "#444";
            }

            // AP Calculation safely
            const currentAp = member.ap || 0;
            const maxAp = member.maxAp || 100;
            const apPercent = Math.min(100, (currentAp / maxAp) * 100);

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>${member.name}</strong>
                    <small>Lv.${member.level} ${member.jobClass}</small>
                </div>
                <div class="bar-container hp-bar-container">
                    <div class="bar hp-bar" style="width: ${(member.hp/member.maxHp)*100}%; background-color: ${this._getHpColor(member)};"></div>
                    <span class="bar-text">${Math.floor(member.hp)}/${member.maxHp}</span>
                </div>
                <div class="bar-container mp-bar-container" style="margin-top:2px;">
                    <div class="bar mp-bar" style="width: ${(member.mp/member.maxMp)*100}%; background-color: #4a90e2;"></div>
                    <span class="bar-text">${member.mp}/${member.maxMp}</span>
                </div>
                <div class="bar-container ap-bar-container" style="margin-top:2px; height: 5px;">
                    <div class="bar ap-bar" style="width: ${apPercent}%; background-color: #f1c40f;"></div>
                </div>
            `;
            this.elements.partyContainer.appendChild(card);
        });
    }

    _getHpColor(member) {
        const ratio = member.hp / member.maxHp;
        if (ratio < 0.3) return "#e74c3c";
        if (ratio < 0.6) return "#f39c12";
        return "#2ecc71";
    }

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

    showModal(contentHtml) {
        if (this.elements.modalContent && this.layers.modal) {
            this.elements.modalContent.innerHTML = contentHtml;
            this.layers.modal.style.display = 'flex';
        }
    }

    hideModal() {
        if (this.layers.modal) {
            this.layers.modal.style.display = 'none';
        }
    }

    renderInventory(party, onEquip) {
        let html = `<h3>🎒 Inventory</h3>`;
        if (party.inventory.length === 0) {
            html += `<p>Empty.</p>`;
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
        let html = '';
        party.getAliveMembers().forEach((char, charIndex) => {
            html += `<button class="equip-btn" data-index="${itemIndex}" data-char="${charIndex}" style="margin-left: 5px; cursor:pointer;">
                ${char.name}
            </button>`;
        });
        return html;
    }
}
