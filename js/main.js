import { UIManager } from './ui_manager.js';
import { BattleScene } from './game_scene.js';
import { Book } from './book.js';
import { Party } from './party.js';
import { Character } from './character.js';
import { AIManager } from './ai/ai_manager.js';
import { CHARACTER_PRESETS } from './data/character_presets.js';
import { ItemFactory } from './item.js';
import { CombatManager } from './combat.js';
import { Blackboard } from './blackboard.js';
// import { Unit } from './unit_placeholder.js'; // Placeholder if needed, but we use Character

// [Game State Definitions]
const GAME_STATE = {
    PAGE_SELECT: 'Page_Select',
    EXPLORE: 'Explore',
    COMBAT: 'Combat',
    LIBIDO_EVENT: 'Libido_Scene',
    GAME_OVER: 'Game_Over',
    MESSIAH_EVENT: 'Messiah_Scene' // [NEW] The Ritual Page
};

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
        this.state = GAME_STATE.PAGE_SELECT;

        // Chat State
        this.currentChatTarget = null;
        this.isChatActive = false;

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
        // Clear existing members if any
        this.party.members = [];

        // Add 4 Specific Characters from Presets
        // Chris (Warrior), Theon (Barbarian), Barrett (Sniper), Silas (Healer)
        // We load them all.

        CHARACTER_PRESETS.forEach(preset => {
            const char = new Character(preset.Name, preset.Class);
            char.loadPreset(preset); // Use loadPreset helper
            this.party.addMember(char);
            this.ui.log(`Joined party: ${char.name} (${char.jobClass}) - ${char.mbti_type}`);
        });

        // Note: The original 'Player' concept is replaced by this full party control/observation style
        // unless we want a specific "Player Avatar". For now, user manages the party.
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

    // [1. Page Generation & Entry]
    async enterNextPage(forcedType = null) {
        this.ui.log("You turn the page...", 'normal');

        // Check for Forced Events (Interrupts)
        const forcedEvent = forcedType || this.checkForceEvents();
        if (forcedEvent) {
             if (forcedEvent === GAME_STATE.LIBIDO_EVENT) {
                 this.state = GAME_STATE.LIBIDO_EVENT;
                 await this.triggerLibidoScene();
                 return;
             }
             // [NEW] Messiah Event Logic (Stub)
             if (forcedEvent === GAME_STATE.MESSIAH_EVENT) {
                 this.state = GAME_STATE.MESSIAH_EVENT;
                 await this.triggerMessiahScene(); // Stub function
                 return;
             }
        }

        // Standard Page Generation
        try {
            this.currentPage = await this.book.generateNextPage();

            // Log Story
            this.ui.log(`<h3>${this.currentPage.title}</h3>`, 'normal');
            this.ui.log(this.currentPage.description, 'normal');

            // [NEW] Party Reactions for Exploration
            this.triggerPartyReaction({
                type: 'PAGE_ARRIVAL',
                title: this.currentPage.title,
                description: this.currentPage.description
            });

            // Map Book Type to Game State
            if (this.currentPage.type === 'battle' || this.currentPage.type === 'boss') {
                // Combat is triggered via "Fight" choice usually, but we can set state context
                this.state = GAME_STATE.PAGE_SELECT;
                this.closeChat();
            } else if (this.currentPage.type === 'rest') {
                // Rest logic handles state transition on choice
                this.state = GAME_STATE.PAGE_SELECT;

                // Open Chat for Rest
                this.openChat('Rest');
                this.aiManager.geminiNarrate("모닥불 타는 소리만 들립니다. 누군가 당신의 말을 기다리는 눈치군요.")
                     .then(text => { if(text) this.ui.log(text); }) // Simple log or specialized logic
                     .catch(() => {});

            } else {
                this.state = GAME_STATE.EXPLORE;
                this.closeChat();
            }

            // Render Choices
            if (this.currentPage.choices && this.currentPage.choices.length > 0) {
                 this.renderVotingUI();
            }

        } catch (e) {
            console.error(e);
            this.ui.log("The pages are stuck together... (Error generating page)");
        }
    }

    // Alias for legacy calls
    async handleTurnPage() {
        return this.enterNextPage();
    }

    checkForceEvents() {
        // [NEW] Check for Messiah Trigger (Stub logic)
        // In the future, this will check for 'Messiah Page' items in the book queue
        // if (this.book.nextPageIsMessiah) return GAME_STATE.MESSIAH_EVENT;

        // High Libido Check -> Force Libido Scene
        const highLibidoMember = this.party.members.find(m => m.hilbertSpace.libidoLevel >= 90);
        if (highLibidoMember) {
            return GAME_STATE.LIBIDO_EVENT;
        }
        return null;
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
        // Since there is no "Player Character" in the list (all are preset chars),
        // we can assume the user acts as the "Director" or one of the characters (e.g. Leader).
        // Let's assume the user vote counts as "Director" vote (break ties or heavy weight).

        const voteCounts = new Array(this.currentPage.choices.length).fill(0);
        const voteDetails = [];

        // User Vote
        voteCounts[playerChoiceIndex] += 1.5; // Weight 1.5
        voteDetails.push(`Director voted for: "${this.currentPage.choices[playerChoiceIndex].text}"`);

        // Party Votes
        this.party.members.forEach((member) => {
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

    async executeChoice(choice) {
        this.ui.log(`> Executing: ${choice.text}`);

        if (choice.action === 'nextPage') {
            this.enterNextPage();
        } else if (choice.action === 'startCombat') {
            this.state = GAME_STATE.COMBAT;
            await this.setupCombat();
        } else if (choice.action === 'rest') {
            // Trigger Rest Event Logic
            this.state = GAME_STATE.EXPLORE; // Rest is explore type
            await this.triggerRestEvent();

            // Then actual mechanic
            this.party.members.forEach(m => m.heal(20));
            this.ui.log("System: Party recovered 20 HP.");

            // Add "Next Page" button manually since we consumed the choice
            this.renderNextPageButton();

        } else if (choice.action === 'openChest') {
            this.awardLoot();
            this.renderNextPageButton();
        } else {
             // Default fallthrough
             this.enterNextPage();
        }
    }

    renderNextPageButton() {
        const div = document.createElement('div');
        div.className = "mt-4";
        const btn = document.createElement('button');
        btn.className = "w-full bg-blue-600 text-white py-2 rounded shadow hover:bg-blue-500";
        btn.innerText = "Continue Journey";
        btn.onclick = () => {
            div.remove();
            this.enterNextPage();
        };
        div.appendChild(btn);
        this.ui.logElement.appendChild(div);
        this.ui.scrollToBottom();
    }

    // [2. Combat Logic]
    async setupCombat() {
        this.ui.log("Combat Started! Enemies approaching...");

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
        this.combatManager = new CombatManager(this.party, async (type, data) => {
            switch(type) {
                case 'combat_start':
                    battleScene.setupCombat(data.party, data.enemies);

                    // Log Encounter Status
                    if (data.encounterStatus === 'Ambush') {
                        this.ui.log(`<h3 class="text-red-600">⚠ AMBUSH! (D20: ${data.encounterRoll})</h3>`, 'combat');
                    } else if (data.encounterStatus === 'Pre-emptive') {
                        this.ui.log(`<h3 class="text-blue-500">⚡ PRE-EMPTIVE STRIKE! (D20: ${data.encounterRoll})</h3>`, 'combat');
                    } else {
                        this.ui.log(`Encounter Roll: ${data.encounterRoll} (Normal)`, 'combat');
                    }

                    // AI Intro for Combat
                    const introTags = {
                        Context: "Battle_Start",
                        Enemies: data.enemies.map(e => e.name),
                        Atmosphere: "Dark_Dungeon" // Could be dynamic from Blackboard
                    };
                    try {
                        const intro = await this.aiManager.generateEventNarrative(introTags);
                        this.ui.log(`<div class="p-2 my-2 text-gray-400 italic text-sm">${intro}</div>`, 'normal');
                    } catch(e) {}
                    break;

                case 'combat_update':
                    battleScene.updateVisuals(data.updates);
                    break;
                case 'action':
                    if (data.type === 'attack') {
                        this.ui.log(`⚔️ <b>${data.attacker.name}</b> attacks <b>${data.target.name}</b> for ${data.damage}!`, 'combat');
                        battleScene.playAttackAnimation(data.attacker, data.target, data.damage);
                    } else if (data.type === 'heal') {
                        this.ui.log(`💚 <b>${data.attacker.name}</b> heals <b>${data.target.name}</b> for ${data.amount}!`, 'combat');
                    }
                    break;
                case 'narrative_event':
                    // Pause combat and generate AI commentary
                    if (this.combatManager) this.combatManager.pause();

                    try {
                        const commentary = await this.aiManager.generateCombatCommentary(data);
                        this.ui.log(`<div class="p-2 my-2 bg-gray-800 text-gray-200 border-l-4 border-purple-500 italic text-sm">${commentary}</div>`, 'normal');

                        // [NEW] Party Reaction to Combat Event (Critical/Kill/etc)
                        await this.triggerPartyReaction({
                            type: 'COMBAT_EVENT',
                            trigger: data.triggerType,
                            actor: data.attacker.name,
                            dmText: commentary
                        });

                    } catch (e) {
                        console.error("Narrative generation failed", e);
                    }

                    if (this.combatManager) this.combatManager.resume();
                    break;
                case 'death':
                    this.ui.log(`💀 <b>${data.target.name}</b> collapses!`, 'combat');
                    battleScene.handleDeath(data.target);
                    break;
                case 'combat_end':
                    if (data.isWin) {
                        this.ui.log("<b>VICTORY!</b> The enemies are defeated.");
                        this.awardLoot();
                        this.renderNextPageButton();
                    } else {
                        this.ui.log("<b>DEFEAT...</b> The party falls.");
                        this.state = GAME_STATE.GAME_OVER;
                    }
                    this.combatManager = null;
                    break;

                case 'instinct_trigger':
                    // [NEW] Visual Feedback for Instinct
                    this.ui.log(`<div class="text-red-600 font-bold border-2 border-red-600 p-1 text-center bg-black animate-pulse">
                        ⚡ INSTINCT AWAKENED: ${data.instinctName} (${data.character.name})
                    </div>`, 'combat');

                    // Phaser Shake Effect
                    if (battleScene && battleScene.cameras && battleScene.cameras.main) {
                        battleScene.cameras.main.shake(300, 0.02);
                    }
                    break;
            }
        });

        // Start with Modifiers
        this.combatManager.startCombat(this.party.getAverageLevel(), this.currentPage.modifiers);
    }

    // [3. Random Event Logic]
    async triggerRandomEvent() {
        // Example implementation if we had pure random events separate from Book
        // For now, Book handles generation, but this function can handle the Narrative part specifically
    }

    // [4. Rest Event Logic]
    async triggerRestEvent() {
        const mood = this.calculatePartyMood();
        this.ui.log(`<i>Atmosphere: ${mood}...</i>`);

        this.ui.log(`<b>Campfire Action:</b> Who will you tend to?`);

        // Create Interaction Buttons
        const div = document.createElement('div');
        div.className = "flex flex-wrap gap-2 my-2";

        this.party.members.forEach(member => {
            if (!member.isAlive()) return;
            const btn = document.createElement('button');
            btn.className = "px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-orange-600";
            btn.innerText = `Tend to ${member.name} (${member.hp}/${member.maxHp} HP)`;
            btn.onclick = () => {
                div.remove();
                this.handleRestInteraction(member, mood);
            };
            div.appendChild(btn);
        });

        this.ui.logElement.appendChild(div);
        this.ui.scrollToBottom();
    }

    async handleRestInteraction(target, mood) {
        // Generate Sensory Description
        const touchTags = {
            Type: "Rest_Touch",
            Actor: target.name,
            Action: "Wound_Care",
            Sensory_Focus: ["Muscle_Tremor", "Sweat", "Scars", "Warmth"],
            Context: `${target.name} is being treated by the Messiah.`
        };

        this.ui.log(`<div class="text-sm text-gray-500">Approaching ${target.name}...</div>`);
        const narrative = await this.aiManager.generateEventNarrative(touchTags);
        this.ui.log(`<div class="p-3 bg-orange-50 border-l-4 border-orange-400 my-2 text-gray-800">${narrative}</div>`, 'normal');

        // Apply Healing
        target.heal(20);
        target.stamina = Math.min(100, target.stamina + 30);
        this.ui.log(`System: ${target.name} recovered 20 HP & 30 Stamina.`);

        // Add Next Page Button
        this.renderNextPageButton();
    }

    // [5. Libido Scene Logic]
    async triggerLibidoScene() {
        const target = this.party.members.find(u => u.hilbertSpace.libidoLevel >= 90) || this.party.members[0];

        // Open Chat for Libido
        this.openChat('Libido');
        this.addChatBubble("거친 숨소리가 공간을 메웁니다. 지금이라면... 무슨 말이든 허용될 것 같습니다.", "system");

        const sceneTags = {
            Type: "Erotic_Scene",
            Actor: target.name,
            Trigger: "High_Libido",
            Visual_Focus: ["Sweat", "Muscle_Contraction", "Veins", "Rough_Breath", "Hyper_Realism"],
            Mode: "Director_Cut",
            Context: `${target.name} is overwhelmed by heat.`
        };

        this.ui.log(`<h3>Warning: Libido Event</h3>`, 'normal');
        this.ui.log(`<div class="p-3 bg-pink-50 border border-pink-200 rounded my-2 text-pink-900 font-serif">Generating Scene...</div>`, 'normal');

        const narrative = await this.aiManager.generateEventNarrative(sceneTags);
        this.ui.log(`<div class="p-4 bg-pink-50 border-l-4 border-pink-500 my-2 text-gray-800">${narrative}</div>`, 'normal');

        // Render Choices: Admire/Praise vs Restrain/Reject
        const div = document.createElement('div');
        div.className = "flex gap-2 my-2 justify-center";

        const btnAdmire = document.createElement('button');
        btnAdmire.className = "px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-500 shadow-md";
        btnAdmire.innerText = "1. Admire & Praise (Desire)";
        btnAdmire.onclick = () => {
            div.remove();
            this.handleLibidoChoice(target, 'Admire');
        };

        const btnReject = document.createElement('button');
        btnReject.className = "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 shadow-md";
        btnReject.innerText = "2. Restrain & Reject (Loyalty)";
        btnReject.onclick = () => {
            div.remove();
            this.handleLibidoChoice(target, 'Reject');
        };

        div.appendChild(btnAdmire);
        div.appendChild(btnReject);
        this.ui.logElement.appendChild(div);
        this.ui.scrollToBottom();
    }

    async handleLibidoChoice(target, type) {
        if (type === 'Admire') {
            this.ui.log(`<div class="text-pink-800 font-bold">> You gaze deeply at ${target.name}'s trembling form.</div>`);
            target.hilbertSpace.libidoLevel += 10;
            // Fanaticism check - increase loyalty/libido
            target.hilbertSpace.loyaltyMessiah += 5;
            this.ui.log(`System: ${target.name}'s Fanaticism (Loyalty+Libido) increased.`);
        } else {
            this.ui.log(`<div class="text-gray-800 font-bold">> You turn away, demanding restraint.</div>`);
            target.hilbertSpace.libidoLevel = Math.max(0, target.hilbertSpace.libidoLevel - 30);
            target.hilbertSpace.loyaltyMessiah += 10;
            this.ui.log(`System: ${target.name}'s Loyalty increased significantly.`);
        }

        // Final reduce Libido to reset event state
        target.hilbertSpace.libidoLevel = Math.max(0, target.hilbertSpace.libidoLevel - 40);

        this.renderNextPageButton();
    }

    // [6. Messiah Scene Logic] (Stub)
    async triggerMessiahScene() {
        this.ui.toggleGlitch(true);
        this.ui.log(`<h3>[System Error] Decoding Memory...</h3>`, 'normal');

        // Brief glitch effect for demo purposes (since it's a stub)
        setTimeout(() => this.ui.toggleGlitch(false), 2000);

        // Future Implementation:
        // 1. Load Reality Log
        // 2. Increase SyncRate
        // 3. Display broken UI
    }

    getPartyStatusSummary() {
        return this.party.members.map(u => `${u.name}(HP:${u.hp}, Lib:${u.hilbertSpace.libidoLevel})`).join(", ");
    }

    calculatePartyMood() {
        const totalLibido = this.party.members.reduce((sum, u) => sum + u.hilbertSpace.libidoLevel, 0);
        if (totalLibido > 150) return "Sexual_Tension";
        return "Calm";
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

    async triggerPartyReaction(contextData) {
        // 1. Select 1-2 Random Members
        const activeMembers = this.party.members.filter(m => m.isAlive());
        if (activeMembers.length === 0) return;

        // Shuffle and pick 1-2
        const shuffled = activeMembers.sort(() => 0.5 - Math.random());
        const count = Math.floor(Math.random() * 2) + 1; // 1 or 2
        const selectedMembers = shuffled.slice(0, count);

        // 2. Call AI
        try {
            const reactions = await this.aiManager.generatePartyReaction(selectedMembers, contextData);

            // 3. Display (Sequential)
            for (const r of reactions) {
                // Ensure format compatibility
                const name = r.name || r.role;
                const action = r.action ? `<i>*${r.action}*</i> ` : "";
                const text = r.text || "...";

                this.ui.log(`<div class="ml-4 my-1 text-sm"><span class="font-bold text-blue-300">${name}:</span> ${action}"${text}"</div>`, 'normal');

                // Wait 1.5s before next message
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        } catch (e) {
            console.error("Party reaction error", e);
        }
    }

    handleFeedback(charName, value) {
        const member = this.party.members.find(m => m.name === charName);
        if (member) {
            const stats = ['E', 'S', 'T', 'J'];
            let maxVal = 0;
            let dominantStat = 'E';

            // Find dominant trait to reinforce/weaken
            // Note: with EI_Val structure, E>50 is E dominant.

            // Simplified logic as prompt didn't specify feedback mechanism change details
            this.ui.log(`Feedback registered for ${member.name}.`);
        }
    }

    // [Chat Engine Methods]
    openChat(mode) {
        this.isChatActive = true;
        const overlay = document.getElementById('chat-overlay');
        overlay.classList.remove('hidden');

        // Dynamic Styling
        overlay.classList.remove('chat-overlay-rest', 'chat-overlay-libido');
        if (mode === 'Rest') {
            overlay.classList.add('chat-overlay-rest');
            document.getElementById('chat-mode-title').innerText = "🔥 CAMPFIRE TALK";
        } else {
            overlay.classList.add('chat-overlay-libido');
            document.getElementById('chat-mode-title').innerText = "💋 SECRET WHISPER";
        }

        // Reset Chat with System Msg
        document.getElementById('chat-history').innerHTML = `<div class="chat-msg system">>> 대화 채널이 열렸습니다. 대상에게 말을 거세요.</div>`;
    }

    closeChat() {
        this.isChatActive = false;
        const overlay = document.getElementById('chat-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    sendChat() {
        const input = document.getElementById('user-input');
        const text = input.value.trim();
        if (!text) return;

        // Show User Message
        this.addChatBubble(text, 'user');
        input.value = "";

        // Determine Target (Simple Logic)
        let targetID = "Chris";
        if (text.includes("테온")) targetID = "Theon";
        if (text.includes("바렛") || text.includes("Barrett")) targetID = "Barrett";
        if (text.includes("사일러스") || text.includes("Silas")) targetID = "Silas";

        // Call AI Logic
        this.callDialogueAI(targetID, text);
    }

    callDialogueAI(targetID, userText) {
        // 1. Get Target Data
        const targetData = this.party.members.find(u => u.name.includes(targetID)) || this.party.members[0];

        // 2. Mock AI Logic (as per request)
        // In real implementation, this would call this.aiManager.generateDialogue(...)

        setTimeout(() => {
            // Simulated Response based on Libido/Mode
            const isLibido = this.isLibidoPage();
            let responseText = "......";
            let effect = { Libido: 0, Loyalty: 0 };

            if (isLibido) {
                responseText = `(거친 숨을 몰아쉬며) ${userText}? 당신이 원하신다면... 제 모든 것을 보이겠습니다.`;
                effect.Libido = 5;
            } else {
                responseText = `(고개를 끄덕이며) "${userText}"라... 명심하겠습니다, 메시아여.`;
                effect.Loyalty = 2;
            }

            // Output
            this.addChatBubble(`${targetData.name}: "${responseText}"`, 'ai');

            // Apply Effect
            if (targetData.hilbertSpace) {
                targetData.hilbertSpace.libidoLevel += effect.Libido;
                // Loyalty update if exists
            }
            // Log effect
            console.log(`[Chat Effect] ${targetData.name} Libido +${effect.Libido}`);

        }, 1000);
    }

    addChatBubble(msg, type) {
        const box = document.getElementById('chat-history');
        const div = document.createElement('div');
        div.className = `chat-msg ${type}`;
        div.innerText = msg;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    checkEnter(e) {
        if(e.key === 'Enter') this.sendChat();
    }

    isLibidoPage() {
        const title = document.getElementById('chat-mode-title');
        return title && title.innerText.includes("WHISPER");
    }
}

// Start the Application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new GameApp();
    window.Engine = window.app; // Alias for HTML onclick handlers
});
