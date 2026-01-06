// Imports from Logic are handled via data passed in
import { Party } from './party.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        this.visuals = new Map(); // Map<Character, Container>
    }

    preload() {
        // Load UI Assets
        this.load.path = 'assets/images/unit-ui/';
        const images = [
            'android-ui.png', 'clown-ui.png', 'commander-ui.png', 'dark-knight-ui.png',
            'esper-ui.png', 'flyingmen-ui.png', 'ghost-ui.png', 'gunner-ui.png',
            'hacker-ui.png', 'mechanic-ui.png', 'medic-ui.png', 'nanomancer-ui.png',
            'paladin-ui.png', 'plague-doctor-ui.png', 'sentinel-ui.png', 'warrior-ui.png'
        ];
        images.forEach(img => {
            this.load.image(img.replace('.png', ''), img);
        });
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

        // Background / Layout Guide
        // Party Area Background (Bottom)
        // this.add.rectangle(275, 520, 530, 140, 0x111111).setStrokeStyle(1, 0x333333);

        this.createPartyVisuals(partyMembers);
        this.createEnemyVisuals(enemies);
    }

    getJobImage(jobClass) {
        // Map job class to image key
        const map = {
            'Warrior': 'warrior-ui',
            'Barbarian': 'dark-knight-ui',
            'Sniper': 'gunner-ui',
            'Healer': 'medic-ui',
            'Paladin': 'paladin-ui',
            'Mechanic': 'mechanic-ui',
            // Add more as needed
        };
        // Simple heuristic for others or fallback
        return map[jobClass] || 'warrior-ui';
    }

    getEnemyImage(name) {
        // Simple hash to pick a random-ish but consistent monster image
        const keys = ['ghost-ui', 'plague-doctor-ui', 'flyingmen-ui', 'android-ui', 'clown-ui'];
        const idx = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % keys.length;
        return keys[idx];
    }

    createPartyVisuals(members) {
        // Layout: Bottom of screen.
        // Front Row: Left 2 slots. Back Row: Right 2 slots.
        // Y = 500 approx.
        const startX = 85;
        const gap = 125;
        const y = 480;

        // Visual Labels for Rows
        this.add.text(145, y - 80, "FRONT LINE", { fontSize: '16px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(395, y - 80, "BACK LINE", { fontSize: '16px', color: '#4444ff', fontStyle: 'bold' }).setOrigin(0.5);

        members.forEach((member, i) => {
            // Layout: 0,1 -> Front (Left), 2,3 -> Back (Right)
            const x = startX + (i * gap);

            const container = this.add.container(x, y);

            // Portrait Box
            const box = this.add.rectangle(0, 0, 100, 100, 0x000000).setStrokeStyle(2, 0x888888);
            container.add(box);

            // Image
            const imgKey = this.getJobImage(member.jobClass);
            const sprite = this.add.image(0, 0, imgKey);
            sprite.setDisplaySize(96, 96);
            container.add(sprite);

            // Name
            const nameBg = this.add.rectangle(0, 40, 96, 20, 0x000000, 0.7);
            container.add(nameBg);
            const name = this.add.text(0, 40, member.name, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
            container.add(name);

            // HP Bar
            const hpBg = this.add.rectangle(0, 60, 96, 6, 0x333333);
            container.add(hpBg);
            const hpFill = this.add.rectangle(-48, 60, 96, 6, 0xe74c3c).setOrigin(0, 0.5);
            container.add(hpFill);

            // AP Bar
            const apBg = this.add.rectangle(0, 68, 96, 4, 0x333333);
            container.add(apBg);
            const apFill = this.add.rectangle(-48, 68, 0, 4, 0xf1c40f).setOrigin(0, 0.5);
            container.add(apFill);

            this.visuals.set(member, {
                container,
                sprite,
                hpFill,
                apFill,
                maxWidth: 96
            });
        });
    }

    createEnemyVisuals(enemies) {
        // Layout: Top Left Area
        // Front Row (1,2): Lower Y (~300)
        // Back Row (3,4): Higher Y (~150)

        const centerX = 275;

        enemies.forEach((enemy, i) => {
            let x, y;

            // i=0,1 -> Front. i=2,3 -> Back.
            if (i < 2) {
                // Front Row
                y = 300;
                x = centerX + ((i === 0 ? -1 : 1) * 80);
            } else {
                // Back Row
                y = 150;
                x = centerX + ((i === 2 ? -1 : 1) * 120);
            }

            const container = this.add.container(x, y);

            // Enemy Sprite
            const imgKey = this.getEnemyImage(enemy.name);
            const sprite = this.add.image(0, 0, imgKey);
            // Random slight scale variation for variety
            const scale = 0.9 + (Math.random() * 0.2);
            sprite.setDisplaySize(110 * scale, 110 * scale);
            // Flip enemies to face left (if original images face right)
            // Assuming UI portraits face front/right.
            sprite.setFlipX(true);

            container.add(sprite);

            // Name
            const name = this.add.text(0, 65, enemy.name, { fontSize: '14px', fill: '#ffaaaa', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
            container.add(name);

            // HP Bar
            const hpBg = this.add.rectangle(0, 80, 80, 6, 0x000000);
            container.add(hpBg);
            const hpFill = this.add.rectangle(-40, 80, 80, 6, 0xff0000).setOrigin(0, 0.5);
            container.add(hpFill);

            this.visuals.set(enemy, {
                container,
                sprite,
                hpFill,
                apFill: { width: 0 }, // Mock AP for enemy if code tries to update it
                maxWidth: 80
            });
        });
    }

    // --- Event Handlers ---

    updateVisuals(updates) {
        updates.forEach(update => {
            const visual = this.visuals.get(update.char);
            if (visual) {
                // Update AP
                if (visual.apFill && visual.apFill.width !== undefined) {
                    visual.apFill.width = (update.ap / update.maxAp) * visual.maxWidth;
                }

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
             // Direction depends on Y position (Bottom units move UP, Top units move DOWN/CENTER)
             // Party is Y > 400. Enemies Y < 400.
             const isParty = attackerVis.container.y > 400;
             const dy = isParty ? -30 : 30;

             this.tweens.add({
                 targets: attackerVis.container,
                 y: attackerVis.container.y + dy,
                 duration: 150,
                 yoyo: true,
                 ease: 'Power1'
             });
        }

        if (targetVis) {
            // Flash
            this.tweens.add({
                targets: targetVis.sprite,
                alpha: 0.3,
                duration: 50,
                yoyo: true,
                repeat: 1
            });

            // Shake
            const startX = targetVis.container.x;
            this.tweens.add({
                targets: targetVis.container,
                x: startX + 5,
                duration: 50,
                yoyo: true,
                repeat: 3,
                onComplete: () => targetVis.container.x = startX
            });

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
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#fff',
            stroke: '#cc0000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.out',
            onComplete: () => text.destroy()
        });
    }

    update() {
        // No logic here!
    }
}
