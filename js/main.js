import { Character } from './character.js';
import { Party } from './party.js';
import { Book, EventType } from './book.js';
import { CombatManager } from './combat.js';

// Game State
const gameState = {
    party: null,
    book: null,
    currentPage: null,
    combatManager: null,
    isProcessing: false
};

// UI References
const ui = {
    partyContainer: document.getElementById('party-status'),
    log: document.getElementById('game-log'),
    pageTitle: document.getElementById('page-title'),
    pageNumber: document.getElementById('page-number'),
    sceneImage: document.getElementById('scene-image'),
    actionArea: document.getElementById('action-area')
};

// Initialize Game
function initGame() {
    log("게임을 초기화합니다...");
    gameState.party = new Party();
    gameState.book = new Book();

    // Create default party
    gameState.party.addMember(new Character("Hero", "Warrior"));
    gameState.party.addMember(new Character("Mage", "Mage"));
    gameState.party.addMember(new Character("Rogue", "Rogue"));
    gameState.party.addMember(new Character("Healer", "Cleric"));

    updatePartyUI();

    // Start with the first page
    turnPage();
}

function turnPage() {
    if (gameState.isProcessing) return;

    // Generate new page
    const newPage = gameState.book.generateNextPage();
    gameState.currentPage = newPage;

    // Update UI
    ui.pageTitle.innerText = newPage.title;
    ui.pageNumber.innerText = `Page ${newPage.id}`;

    // Update Visuals based on event type
    updateVisuals(newPage.type);

    // Log the description
    log(""); // Spacer
    log(`[${newPage.title}]`);
    log(newPage.description);

    // Render Buttons
    renderButtons(newPage.choices);
}

function updateVisuals(type) {
    let color = "#ccc";
    let text = "Scene Image";

    switch (type) {
        case EventType.BATTLE:
            color = "#5c2b2b";
            text = "⚔️ BATTLE ⚔️";
            break;
        case EventType.TREASURE:
            color = "#d4af37";
            text = "💎 TREASURE 💎";
            break;
        case EventType.REST:
            color = "#4a6fa5";
            text = "⛺ REST ⛺";
            break;
        case EventType.STORY:
            color = "#555";
            text = "📖 STORY 📖";
            break;
    }

    ui.sceneImage.style.backgroundColor = color;
    ui.sceneImage.innerText = text;
    ui.sceneImage.style.color = "#fff";
}

function renderButtons(choices) {
    ui.actionArea.innerHTML = '';

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.innerText = choice.text;
        btn.onclick = () => handleAction(choice.action);
        ui.actionArea.appendChild(btn);
    });
}

function handleAction(actionKey) {
    switch (actionKey) {
        case "nextPage":
            turnPage();
            break;
        case "startCombat":
            startCombat();
            break;
        case "openChest":
            log(">> 상자를 열었습니다! 100 골드를 획득했습니다.");
            gameState.party.gold += 100;
            turnPage();
            break;
        case "rest":
            log(">> 파티가 휴식을 취했습니다. 체력이 회복됩니다.");
            gameState.party.members.forEach(m => m.heal(20));
            updatePartyUI();
            turnPage();
            break;
        default:
            console.warn("Unknown action:", actionKey);
            turnPage();
    }
}


// UI Helper: Log message
function log(message) {
    const p = document.createElement('p');
    p.innerText = message;
    ui.log.appendChild(p);
    ui.log.scrollTop = ui.log.scrollHeight;
}

// UI Helper: Update Party Status
function updatePartyUI() {
    ui.partyContainer.innerHTML = ''; // Clear current
    gameState.party.members.forEach(member => {
        const card = document.createElement('div');
        card.className = 'char-card';
        // Check dead/alive
        if (!member.isAlive()) {
            card.style.opacity = 0.5;
            card.style.backgroundColor = "#444";
        }

        // Simple status display
        card.innerHTML = `
            <strong>${member.name}</strong>
            <span>Lv.${member.level} ${member.jobClass}</span>
            <div style="font-size: 0.9em;">HP: <span style="color:${getHpColor(member)}">${member.hp}/${member.maxHp}</span></div>
            <div style="font-size: 0.9em;">MP: ${member.mp}/${member.maxMp}</div>
        `;
        ui.partyContainer.appendChild(card);
    });
}

function getHpColor(member) {
    const ratio = member.hp / member.maxHp;
    if (ratio < 0.3) return "red";
    if (ratio < 0.6) return "orange";
    return "green";
}

function startCombat() {
    gameState.isProcessing = true; // Block page turning
    ui.actionArea.innerHTML = ''; // Hide buttons

    gameState.combatManager = new CombatManager(
        gameState.party,
        log,
        updatePartyUI,
        (isWin) => {
            gameState.isProcessing = false;
            gameState.combatManager = null;
            if (isWin) {
                turnPage();
            } else {
                alert("Game Over");
                location.reload(); // Simple restart
            }
        }
    );

    const difficulty = Math.floor(gameState.book.currentPageNumber / 5) + 1;
    gameState.combatManager.startCombat(difficulty);
}

document.addEventListener("DOMContentLoaded", () => {
    initGame();
});
