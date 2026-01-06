import { UIManager } from './ui_manager.js';
import { BattleScene } from './game_scene.js';
import { Book } from './book.js';
import { Party } from './party.js';
import { Character } from './character.js';
import { AIManager } from './ai/ai_manager.js';
import { MBTI_PRESETS } from './data/mbti_presets.js';
import { ItemFactory } from './item.js';
import { CombatManager } from './combat.js';
import { Blackboard } from './blackboard.js';

class GameApp {
    constructor() {
        this.ui = new UIManager();
        this.phaserGame = null;
        this.apiKey = localStorage.getItem('google_api_key');

        // Game Logic
        this.blackboard = new Blackboard();
        this.aiManager = new AIManager(this.blackboard);
        this.book = new Book(this.aiManager, this.blackboard);
        this.party = new Party();
        this.combatManager = null;

        // State
        this.currentPage = null;

        this.init();
    }

    init() {
        // Setup UI Callbacks
        this.ui.onStartGame = (key) => this.handleStartGame(key);
        this.ui.onTurnPage = () => this.handleTurnPage();
        this.ui.onInventory = () => this.handleInventory();
        this.ui.onDownloadLog = () => this.blackboard.getLogManager().downloadLogs();

        // Feedback Callbacks
        this.ui.onApprove = (charName) => this.handleFeedback(charName, 2);
        this.ui.onDisapprove = (charName) => this.handleFeedback(charName, -2);

        // Check for existing API Key
        if (this.apiKey) {
            this.aiManager.setApiKey(this.apiKey);
            this.ui.hideSetup();
            this.initializeParty();
            this.ui.log("Grimoire connected. Welcome back.");
            this.startPhaser();
        } else {
            this.ui.showSetup();
        }
    }

    handleStartGame(key) {
        this.apiKey = key;
        localStorage.setItem('google_api_key', key);
        this.aiManager.setApiKey(key);
        this.ui.hideSetup();

        this.initializeParty();
        this.ui.log("Key accepted. The Grimoire opens...");
        this.startPhaser();

        // Generate first page
        this.handleTurnPage();
    }

    initializeParty() {
        // Create Player
        const player = new Character("Player", "Adventurer");
        // Player stats could be custom, but let's leave default for now
        this.party.addMember(player);

        // Add AI Companions (One of each Role for balance, or random)
        // Let's pick 3 random MBTI presets
        const presets = Object.values(MBTI_PRESETS);
        for(let i=0; i<3; i++) {
            const p = presets[Math.floor(Math.random() * presets.length)];
            const char = new Character(p.name, p.baseClass);
            char.setMBTI(p.stats); // Use the stats from preset
            // Add initial traits
            p.traits.forEach(t => char.addTag('traits', t));

            this.party.addMember(char);
            this.ui.log(`Joined party: ${char.name} (${char.jobClass}) - ${char.mbti_type}`);
        }
    }

    startPhaser() {
        const config = {
            type: Phaser.AUTO,
            parent: 'phaser-container',
            width: 550, // Approx half of book width
            height: 600, // Approx height
            backgroundColor: '#1a1a1a',
            scene: [BattleScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        this.phaserGame = new Phaser.Game(config);

        // Listen for events from Phaser if needed
        this.phaserGame.events.on('log-text', (text, type) => {
            this.ui.log(text, type);
        });

        this.ui.log("Visual engine initialized.");
    }

    async handleTurnPage() {
        this.ui.log("You turn the page...", 'normal');

        // 1. Generate Page
        try {
            this.currentPage = await this.book.generateNextPage();

            // 2. Log Story
            this.ui.log(`<h3>${this.currentPage.title}</h3>`, 'normal');
            this.ui.log(this.currentPage.description, 'normal');

            // 3. Render Choices / Start Voting Logic
            if (this.currentPage.choices && this.currentPage.choices.length > 0) {
                 this.renderVotingUI();
            } else {
                // No choices? Maybe automatic next page or just text
            }

        } catch (e) {
            console.error(e);
            this.ui.log("The pages are stuck together... (Error generating page)");
        }
    }

    renderVotingUI() {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = "mt-4 border-t pt-2";

        const title = document.createElement('p');
        title.className = "font-bold text-gray-700 mb-2";
        title.innerText = "Vote for Action:";
        choicesDiv.appendChild(title);

        this.currentPage.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = "block w-full text-left px-3 py-2 mb-2 bg-white border rounded shadow-sm hover:bg-blue-50";
            btn.innerText = `${index + 1}. ${choice.text}`;
            btn.onclick = () => this.handlePlayerVote(index);
            choicesDiv.appendChild(btn);
        });

        this.ui.logElement.appendChild(choicesDiv);
        this.ui.scrollToBottom();
    }

    handlePlayerVote(playerChoiceIndex) {
        // 1. Calculate AI Votes
        const votes = [0, 0]; // Assuming max 2 choices for now?
        // Actually choices length is dynamic.
        const voteCounts = new Array(this.currentPage.choices.length).fill(0);
        const voteDetails = [];

        // Player Vote
        voteCounts[playerChoiceIndex]++;
        voteDetails.push(`Player voted for: "${this.currentPage.choices[playerChoiceIndex].text}"`);

        // AI Votes
        this.party.members.forEach((member, index) => {
            if (index === 0) return; // Skip Player

            // Find best choice
            let bestScore = -9999;
            let bestChoiceIndex = -1;

            this.currentPage.choices.forEach((c, cIndex) => {
                const score = member.evaluateChoice(c, this.party);
                if (score > bestScore) {
                    bestScore = score;
                    bestChoiceIndex = cIndex;
                }
            });

            if (bestChoiceIndex !== -1) {
                voteCounts[bestChoiceIndex]++;
                voteDetails.push(`${member.name} (${member.mbti_type}) voted for: "${this.currentPage.choices[bestChoiceIndex].text}"`);
            }
        });

        // 2. Display Results
        this.ui.log("<b>Voting Results:</b>");
        voteDetails.forEach(v => this.ui.log(v));

        // Determine Winner
        let maxVotes = -1;
        let winnerIndex = -1;
        for(let i=0; i<voteCounts.length; i++) {
            if (voteCounts[i] > maxVotes) {
                maxVotes = voteCounts[i];
                winnerIndex = i;
            }
        }

        // Check for Tie (Simple: first one wins or random? Or Player wins ties?)
        // Let's say Player wins ties for now to be generous.
        if (voteCounts[playerChoiceIndex] === maxVotes) {
            winnerIndex = playerChoiceIndex;
        }

        const winningChoice = this.currentPage.choices[winnerIndex];

        // 3. Check for Persuasion Opportunity
        if (winnerIndex !== playerChoiceIndex) {
            this.ui.log(`The party wants to <b>${winningChoice.text}</b>.`, 'normal');
            this.offerPersuasion(playerChoiceIndex, winnerIndex);
        } else {
            this.ui.log(`The party agrees to <b>${winningChoice.text}</b>.`);
            this.executeChoice(winningChoice);
        }
    }

    offerPersuasion(playerIndex, winnerIndex) {
        const div = document.createElement('div');
        div.className = "mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded";

        const p = document.createElement('p');
        p.innerText = "You disagree with the majority. Attempt to persuade them?";
        p.className = "mb-2 text-sm font-bold text-yellow-800";
        div.appendChild(p);

        const btnYes = document.createElement('button');
        btnYes.className = "px-3 py-1 bg-yellow-500 text-white rounded mr-2";
        btnYes.innerText = "Persuade (Roll D20 + Cha)";
        btnYes.onclick = () => {
            div.remove();
            this.handlePersuasion(playerIndex, winnerIndex);
        };

        const btnNo = document.createElement('button');
        btnNo.className = "px-3 py-1 bg-gray-300 rounded";
        btnNo.innerText = "Go with majority";
        btnNo.onclick = () => {
            div.remove();
            this.executeChoice(this.currentPage.choices[winnerIndex]);
        };

        div.appendChild(btnYes);
        div.appendChild(btnNo);
        this.ui.logElement.appendChild(div);
        this.ui.scrollToBottom();
    }

    handlePersuasion(playerIndex, winnerIndex) {
        // Roll D20
        const d20 = Math.floor(Math.random() * 20) + 1;
        // Mock Charisma Mod (e.g., +2)
        const chaMod = 2;
        const total = d20 + chaMod;
        const DC = 12; // Difficulty

        this.ui.log(`Persuasion Check: D20(${d20}) + ${chaMod} = ${total} (DC ${DC})`);

        if (total >= DC) {
            this.ui.log("<b>Success!</b> You convinced the party.");
            this.executeChoice(this.currentPage.choices[playerIndex]);
        } else {
            this.ui.log("<b>Failure.</b> The party ignores your pleas.");
            this.executeChoice(this.currentPage.choices[winnerIndex]);
        }
    }

    executeChoice(choice) {
        this.ui.log(`> Executing: ${choice.text}`);

        if (choice.action === 'nextPage') {
            this.handleTurnPage();
        } else if (choice.action === 'startCombat') {
            this.ui.log("Combat Started! Enemies approaching...");

            // Get BattleScene
            // We assume the scene is active or at least created.
            // Safe way is to get from game instance if available.
            if (!this.phaserGame) {
                this.ui.log("Error: Visual Engine not ready.");
                return;
            }

            const battleScene = this.phaserGame.scene.getScene('BattleScene');
            if (!battleScene) {
                 this.ui.log("Error: Battle Scene not found.");
                 return;
            }

            // Create Combat Manager
            this.combatManager = new CombatManager(this.party, (type, data) => {
                switch(type) {
                    case 'combat_start':
                        battleScene.setupCombat(data.party, data.enemies);
                        break;
                    case 'combat_update':
                        battleScene.updateVisuals(data.updates);
                        break;
                    case 'action':
                        if (data.type === 'attack') {
                            this.ui.log(`⚔️ <b>${data.attacker.name}</b> attacks <b>${data.target.name}</b> for ${data.damage}!`, 'combat');
                            battleScene.playAttackAnimation(data.attacker, data.target, data.damage);
                        }
                        break;
                    case 'death':
                        this.ui.log(`💀 <b>${data.target.name}</b> collapses!`, 'combat');
                        battleScene.handleDeath(data.target);
                        break;
                    case 'combat_end':
                        if (data.isWin) {
                            this.ui.log("<b>VICTORY!</b> The enemies are defeated.");
                            this.awardLoot();
                            this.handleTurnPage();
                        } else {
                            this.ui.log("<b>DEFEAT...</b> The party falls.");
                            // Handle game over logic?
                        }
                        this.combatManager = null;
                        break;
                }
            });

            // Start
            this.combatManager.startCombat(this.party.getAverageLevel(), "Shadow");

        } else if (choice.action === 'rest') {
            this.party.members.forEach(m => m.heal(20));
            this.ui.log("Party rested and recovered HP.");
            this.handleTurnPage();
        } else if (choice.action === 'openChest') {
            this.awardLoot();
            this.handleTurnPage();
        } else {
             // Default fallthrough
             this.handleTurnPage();
        }
    }

    awardLoot() {
        const item = ItemFactory.createLootFromPage(this.currentPage);
        this.party.addItem(item);
        this.ui.log(`<b>Loot:</b> You found a <span class="text-yellow-400">${item.name}</span>!`, 'normal');
        this.ui.log(`<i>${item.description}</i>`, 'normal');
    }

    handleInventory() {
        this.ui.log("Inventory:");
        if (this.party.inventory.length === 0) {
            this.ui.log(" - (Empty)");
        } else {
            this.party.inventory.forEach(item => {
                this.ui.log(` - ${item.name} (${item.value})`);
            });
        }
    }

    handleFeedback(charName, value) {
        const member = this.party.members.find(m => m.name === charName);
        if (member) {
            const stats = ['E', 'S', 'T', 'J'];
            let maxVal = 0;
            let dominantStat = 'E';

            stats.forEach(s => {
                if (Math.abs(member.mbti[s]) > Math.abs(maxVal)) {
                    maxVal = member.mbti[s];
                    dominantStat = s;
                }
            });

            const sign = Math.sign(maxVal) || 1;
            const change = value * sign;

            member.adjustMBTI(dominantStat, change);
            this.ui.log(`${member.name}'s personality shifted. (${dominantStat} ${change > 0 ? 'reinforced' : 'weakened'})`, 'normal');
        }
    }
}

// Start the Application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new GameApp();
});
