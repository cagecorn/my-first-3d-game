import { UIManager } from './ui_manager.js';
import { BattleScene } from './game_scene.js';
// Import other logic as needed (Party, Item, etc.) - keeping it simple for now

class GameApp {
    constructor() {
        this.ui = new UIManager();
        this.phaserGame = null;
        this.apiKey = localStorage.getItem('google_api_key');

        this.init();
    }

    init() {
        // Setup UI Callbacks
        this.ui.onStartGame = (key) => this.handleStartGame(key);
        this.ui.onTurnPage = () => this.handleTurnPage();
        this.ui.onInventory = () => this.handleInventory();

        // Check for existing API Key
        if (this.apiKey) {
            this.ui.hideSetup();
            this.ui.log("Grimoire connected. Welcome back.");
            this.startPhaser();
        } else {
            this.ui.showSetup();
        }
    }

    handleStartGame(key) {
        this.apiKey = key;
        localStorage.setItem('google_api_key', key);
        this.ui.hideSetup();
        this.ui.log("Key accepted. The Grimoire opens...");
        this.startPhaser();
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

        // Listen for events from Phaser
        this.phaserGame.events.on('log-text', (text, type) => {
            this.ui.log(text, type);
        });

        this.ui.log("Visual engine initialized.");
    }

    handleTurnPage() {
        this.ui.log("You turn the page...", 'normal');
        // Logic to generate new encounter, update Phaser scene, etc.
        // For now, trigger a dummy effect in Phaser if needed, or just log.
    }

    handleInventory() {
        this.ui.log("Inventory is empty (Work in Progress).");
    }
}

// Start the Application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new GameApp();
});
