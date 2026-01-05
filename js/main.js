import { Character } from './character.js';
import { Party } from './party.js';
import { Book, EventType } from './book.js';
import { CombatManager } from './combat.js';
import { UIEngine } from './ui.js';
import { ItemFactory } from './item.js';
import { AIManager } from './ai/ai_manager.js';

// Game State
const gameState = {
    party: null,
    book: null,
    currentPage: null,
    combatManager: null,
    isProcessing: false,
    aiManager: new AIManager()
};

// Initialize UI Engine
const ui = new UIEngine();

// Initialize Game
function initGame() {
    ui.initialize();

    // Setup API Key Input
    if (ui.elements.btnStartGame) {
        ui.elements.btnStartGame.onclick = () => {
            const key = ui.elements.apiKeyInput.value.trim();
            if (key) {
                gameState.aiManager.setApiKey(key);
                ui.hideLayer('setup');
                startGameLoop();
            } else {
                alert("API Key를 입력해주세요.");
            }
        };
    }
}

function startGameLoop() {
    // Wire up inventory
    ui.onInventoryClick = () => {
        ui.renderInventory(gameState.party, (itemIndex, charIndex) => {
            const item = gameState.party.inventory[itemIndex];
            const char = gameState.party.getAliveMembers()[charIndex];

            if (item && char) {
                if (item.type === 'potion') {
                     // Use potion
                     const healAmount = item.value;
                     char.heal(healAmount);
                     gameState.party.removeItem(item);
                     ui.log(`>> ${char.name}에게 ${item.name}을(를) 사용했습니다. 체력 ${healAmount} 회복.`);
                } else {
                    // Equip
                    const oldItem = char.equipItem(item);
                    gameState.party.removeItem(item);
                    if (oldItem) {
                        gameState.party.addItem(oldItem);
                        ui.log(`>> ${char.name}: ${oldItem.name} 해제, ${item.name} 장착.`);
                    } else {
                        ui.log(`>> ${char.name}: ${item.name} 장착.`);
                    }
                }

                ui.updateParty(gameState.party.members);
                ui.hideModal(); // Close after action
            }
        });
    };

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

async function turnPage() {
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

    // Trigger AI Reaction
    triggerAiReaction(newPage);
}

async function triggerAiReaction(page) {
    // Visual indicator that AI is thinking?
    // ui.log("...");

    const reactions = await gameState.aiManager.generatePartyReaction(gameState.party.members, page);

    if (reactions && Array.isArray(reactions)) {
        reactions.forEach(reaction => {
            ui.log(`>> ${reaction.name}: "${reaction.text}"`);
        });
    }
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
            const goldAmount = 100;
            const newItem = ItemFactory.createRandomItem();

            gameState.party.gold += goldAmount;
            gameState.party.addItem(newItem);

            ui.log(`>> 상자를 열었습니다! ${goldAmount} 골드와 [${newItem.name}]을(를) 획득했습니다.`);
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
                // Drop Item chance
                if (Math.random() < 0.5) {
                    const dropItem = ItemFactory.createRandomItem();
                    gameState.party.addItem(dropItem);
                    ui.log(`>> 승리 보상으로 [${dropItem.name}]을(를) 획득했습니다!`);
                }
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
