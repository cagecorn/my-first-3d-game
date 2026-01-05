// Imports from Logic (assuming these files exist and export correctly)
// If logic files are not Modules yet, we might need to adjust.
// For now, I'll mock the integration or assume the classes are available globally if they were scripts,
// but since we are using type="module", we should import them.
// Let's assume standard exports.

import { Party } from './party.js';
import { Character } from './character.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        this.party = []; // Array of visual objects
        this.enemies = []; // Array of visual objects
        this.isCombatActive = false;
    }

    preload() {
        // Load placeholders
        // We can generate textures programmatically in 'create', so no external assets needed yet.
    }

    create(data) {
        // data passed from main.js (e.g. initial party state)
        this.gameLogicParty = data.party; // The logic object

        // Background (Canvas is black by default, but let's make it dark grey)
        this.cameras.main.setBackgroundColor('#1a1a1a');

        // Create Visuals
        this.createPartyVisuals();
        this.createEnemyVisuals(); // Mock enemies for now

        // Event Listener for logic updates?
        // In a real loop, update() drives the logic.

        this.isCombatActive = true;
    }

    createPartyVisuals() {
        const startX = 50;
        const startY = 300;
        const gap = 120;

        // Mock party data if not provided (for testing visualization)
        const partySize = 3;

        for (let i = 0; i < partySize; i++) {
            const x = startX + (i * gap);
            const y = startY;

            // Character Container
            const container = this.add.container(x, y);

            // Sprite Placeholder (Circle)
            const circle = this.add.circle(0, 0, 30, 0x3498db);
            container.add(circle);

            // Name Text
            const name = this.add.text(0, 40, `Hero ${i+1}`, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
            container.add(name);

            // HP Bar Background
            const hpBg = this.add.rectangle(0, 55, 60, 6, 0x333333);
            container.add(hpBg);

            // HP Bar Fill
            const hpFill = this.add.rectangle(-30, 55, 60, 6, 0xe74c3c).setOrigin(0, 0.5);
            container.add(hpFill);

            // AP Bar Background
            const apBg = this.add.rectangle(0, 65, 60, 6, 0x333333);
            container.add(apBg);

            // AP Bar Fill
            const apFill = this.add.rectangle(-30, 65, 0, 6, 0xf1c40f).setOrigin(0, 0.5);
            container.add(apFill);

            // Store ref for updates
            this.party.push({
                container,
                apFill,
                hpFill,
                ap: 0,
                speed: 1 + (Math.random() * 0.5), // Random speed
                name: `Hero ${i+1}`
            });
        }
    }

    createEnemyVisuals() {
        const startX = 400; // Right side of the left page
        const startY = 100;
        const gap = 100;

        const enemySize = 2;

        for (let i = 0; i < enemySize; i++) {
            const x = startX;
            const y = startY + (i * gap);

            const container = this.add.container(x, y);

            // Enemy Sprite (Square)
            const rect = this.add.rectangle(0, 0, 50, 50, 0xe74c3c);
            container.add(rect);

            const name = this.add.text(0, 40, `Monster ${i+1}`, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
            container.add(name);

            // Ref
            this.enemies.push({
                container,
                rect, // To flash
                hp: 100,
                maxHp: 100,
                name: `Monster ${i+1}`
            });
        }
    }

    update(time, delta) {
        if (!this.isCombatActive) return;

        // Simulate AP Growth
        this.party.forEach(hero => {
            hero.ap += (hero.speed * delta * 0.05); // Speed factor

            // Update Visual Bar (Max AP = 100)
            const width = Phaser.Math.Clamp(hero.ap, 0, 100) * 0.6; // 60px wide bar
            hero.apFill.width = width;

            // Attack Trigger
            if (hero.ap >= 100) {
                hero.ap = 0;
                this.performAttack(hero);
            }
        });
    }

    performAttack(attacker) {
        // Pick random enemy
        const targetIndex = Phaser.Math.Between(0, this.enemies.length - 1);
        const target = this.enemies[targetIndex];

        // 1. Shake Camera
        this.cameras.main.shake(100, 0.01);

        // 2. Flash Target
        this.tweens.add({
            targets: target.rect,
            alpha: 0,
            duration: 50,
            yoyo: true,
            repeat: 1
        });

        // 3. Floating Text
        const dmg = Phaser.Math.Between(10, 20);
        this.showFloatingText(target.container.x, target.container.y, `-${dmg}`);

        // 4. Update Log (Call out to UI Manager via registry or event)
        // Access the UI Manager passed in init or global?
        // Best practice: Emit an event on the Game instance.
        this.game.events.emit('log-text', `⚔️ **${attacker.name}** attacks **${target.name}** for ${dmg} damage!`, 'combat');
    }

    showFloatingText(x, y, message) {
        const text = this.add.text(x, y - 20, message, {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }
}
