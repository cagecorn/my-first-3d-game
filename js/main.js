import { Character } from './character.js';
import { Party } from './party.js';
import { Book, EventType } from './book.js';
import { CombatManager } from './combat.js';
import { UIEngine } from './ui.js';

// Game State
const gameState = {
    party: null,
    book: null,
    currentPage: null,
    combatManager: null,
    isProcessing: false
};

// Initialize UI Engine
const ui = new UIEngine();

// Initialize Game
function initGame() {
    ui.initialize();
    ui.log("게임을 초기화합니다...");

    gameState.party = new Party();
    gameState.book = new Book();

    // Create default party
    gameState.party.addMember(new Character("Hero", "Warrior"));
    gameState.party.addMember(new Character("Mage", "Mage"));
    gameState.party.addMember(new Character("Rogue", "Rogue"));
    gameState.party.addMember(new Character("Healer", "Cleric"));

    ui.updateParty(gameState.party.members);

    // Start with the first page
    turnPage();
}

function turnPage() {
    if (gameState.isProcessing) return;

    // Generate new page
    const newPage = gameState.book.generateNextPage();
    gameState.currentPage = newPage;

    // Update UI
    ui.updatePageInfo(newPage.title, newPage.id);

    // Update Visuals based on event type
    updateVisuals(newPage.type);

    // Log the description
    ui.log(""); // Spacer
    ui.log(`[${newPage.title}]`);
    ui.log(newPage.description);

    // Render Buttons
    ui.setButtons(newPage.choices, handleAction);
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

    ui.updateScene(type, text, color);
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
            ui.log(">> 상자를 열었습니다! 100 골드를 획득했습니다.");
            gameState.party.gold += 100;
            turnPage();
            break;
        case "rest":
            ui.log(">> 파티가 휴식을 취했습니다. 체력이 회복됩니다.");
            gameState.party.members.forEach(m => m.heal(20));
            ui.updateParty(gameState.party.members);
            turnPage();
            break;
        default:
            console.warn("Unknown action:", actionKey);
            turnPage();
    }
}

function startCombat() {
    gameState.isProcessing = true; // Block page turning
    ui.clearButtons(); // Hide buttons

    // Wrapper function to bind the UI instance's log method context if needed,
    // but here we just pass a lambda calling ui.log
    const logWrapper = (msg) => ui.log(msg);
    const updatePartyWrapper = () => ui.updateParty(gameState.party.members);

    gameState.combatManager = new CombatManager(
        gameState.party,
        logWrapper,
        updatePartyWrapper,
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
