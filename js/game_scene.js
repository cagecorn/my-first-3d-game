// Imports from Logic are handled via data passed in
import { Party } from './party.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        this.visuals = new Map(); // Map<Character, Container>
    }

    preload() {
        // No assets to load yet
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');

        // Listen for global game events if needed, but we expect Main to call methods directly
        // or we can set up an event emitter bridge.

        // Ideally, we wait for 'setupCombat' call.
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "Waiting for Combat...", { color: '#666' }).setOrigin(0.5);
    }

    setupCombat(partyMembers, enemies) {
        this.children.removeAll(); // Clear previous scene
        this.visuals.clear();

        this.createPartyVisuals(partyMembers);
        this.createEnemyVisuals(enemies);
    }

    createPartyVisuals(members) {
        const startX = 50;
        const startY = 300;
        const gap = 120;

        members.forEach((member, i) => {
            const x = startX + (i * gap);
            const y = startY;

            const container = this.add.container(x, y);

            // Sprite Placeholder
            const circle = this.add.circle(0, 0, 30, 0x3498db);
            container.add(circle);

            // Name
            const name = this.add.text(0, 40, member.name, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
            container.add(name);

            // HP Bar
            const hpBg = this.add.rectangle(0, 55, 60, 6, 0x333333);
            container.add(hpBg);
            const hpFill = this.add.rectangle(-30, 55, 60, 6, 0xe74c3c).setOrigin(0, 0.5);
            container.add(hpFill);

            // AP Bar
            const apBg = this.add.rectangle(0, 65, 60, 6, 0x333333);
            container.add(apBg);
            const apFill = this.add.rectangle(-30, 65, 0, 6, 0xf1c40f).setOrigin(0, 0.5);
            container.add(apFill);

            this.visuals.set(member, {
                container,
                hpFill,
                apFill,
                sprite: circle,
                maxWidth: 60
            });
        });
    }

    createEnemyVisuals(enemies) {
        const startX = 400;
        const startY = 100;
        const gap = 100;

        enemies.forEach((enemy, i) => {
            const x = startX;
            const y = startY + (i * gap);

            const container = this.add.container(x, y);

            const rect = this.add.rectangle(0, 0, 50, 50, 0xe74c3c);
            container.add(rect);

            const name = this.add.text(0, 40, enemy.name, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
            container.add(name);

            // HP/AP for enemies too?
            // Minimal enemies usually just show HP or nothing. Let's add small HP bar.
            const hpBg = this.add.rectangle(0, -35, 50, 4, 0x333333);
            container.add(hpBg);
            const hpFill = this.add.rectangle(-25, -35, 50, 4, 0xe74c3c).setOrigin(0, 0.5);
            container.add(hpFill);

            // AP Bar (optional for enemies, but good for strategy)
            const apBg = this.add.rectangle(0, -30, 50, 4, 0x333333);
            container.add(apBg);
            const apFill = this.add.rectangle(-25, -30, 0, 4, 0xf1c40f).setOrigin(0, 0.5);
            container.add(apFill);

            this.visuals.set(enemy, {
                container,
                sprite: rect,
                hpFill,
                apFill,
                maxWidth: 50
            });
        });
    }

    // --- Event Handlers ---

    updateVisuals(updates) {
        updates.forEach(update => {
            const visual = this.visuals.get(update.char);
            if (visual) {
                // Update AP
                visual.apFill.width = (update.ap / update.maxAp) * visual.maxWidth;

                // Update HP
                if (update.char.maxHp > 0) {
                     visual.hpFill.width = (update.char.hp / update.char.maxHp) * visual.maxWidth;
                }
            }
        });
    }

    playAttackAnimation(attacker, target, damage) {
        const attackerVis = this.visuals.get(attacker);
        const targetVis = this.visuals.get(target);

        if (attackerVis) {
             // Jump forward tween
             this.tweens.add({
                 targets: attackerVis.container,
                 x: attackerVis.container.x + (attackerVis.container.x < 300 ? 20 : -20),
                 duration: 100,
                 yoyo: true
             });
        }

        if (targetVis) {
            // Flash
            this.tweens.add({
                targets: targetVis.sprite,
                alpha: 0,
                duration: 50,
                yoyo: true,
                repeat: 1
            });

            // Shake
            // this.cameras.main.shake(100, 0.005); // Global shake might be too much if frequent
            targetVis.container.x += 5;
            this.time.delayedCall(50, () => targetVis.container.x -= 5);

            // Float Text
            this.showFloatingText(targetVis.container.x, targetVis.container.y, `-${damage}`);
        }
    }

    handleDeath(target) {
        const vis = this.visuals.get(target);
        if (vis) {
            this.tweens.add({
                targets: vis.container,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => {
                    vis.container.setVisible(false);
                }
            });
        }
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

    update() {
        // No logic here!
    }
}
