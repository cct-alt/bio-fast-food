export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
    }

    init() {
        try {
            let g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('p_circle', 8, 8);
            g.destroy();

            this.successEmitter = this.createEmitterSafe('p_circle', {
                speed: { min: 200, max: 400 }, angle: { min: 220, max: 320 },
                scale: { start: 1.5, end: 0 }, tint: [0xf1c40f, 0xe74c3c, 0x2ecc71, 0x3498db],
                lifespan: 1500, gravityY: 500
            });

            this.failEmitter = this.createEmitterSafe('p_circle', {
                speed: { min: 100, max: 250 }, angle: { min: 0, max: 360 },
                scale: { start: 1.5, end: 0 }, tint: [0xe74c3c, 0xc0392b, 0x333333],
                lifespan: 800
            });

            this.waterEmitter = this.createEmitterSafe('p_circle', {
                speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
                scale: { start: 1.2, end: 0 }, tint: [0x3498db, 0x85c1e9, 0xd4e6f1],
                lifespan: 1000, alpha: { start: 1, end: 0 }
            });

            // 【新增】專屬於氫鍵的電火花特效
            this.hBondEmitter = this.createEmitterSafe('p_circle', {
                speed: { min: 30, max: 80 }, angle: { min: 0, max: 360 },
                scale: { start: 1.0, end: 0 }, tint: [0xf1c40f, 0xf39c12],
                lifespan: 800, alpha: { start: 1, end: 0 }
            });
        } catch (err) {
            console.warn('粒子系統初始化失敗', err);
        }
    }

    createEmitterSafe(texture, config) {
        if (typeof this.scene.add.particles === 'function') {
            let em;
            try {
                config.emitting = false;
                em = this.scene.add.particles(0, 0, texture, config);
                if (em && em.setDepth) { em.setDepth(150); return em; }
            } catch (e) { }

            config.on = false;
            let mgr = this.scene.add.particles(texture);
            mgr.setDepth(150);
            return mgr.createEmitter(config);
        }
        return { explode: () => { } };
    }

    playSuccess(x, y) {
        if (this.successEmitter && typeof this.successEmitter.explode === 'function') {
            this.successEmitter.explode(50, x, y);
        }
    }

    playFail(x, y) {
        if (this.failEmitter && typeof this.failEmitter.explode === 'function') {
            this.failEmitter.explode(30, x, y);
        }
    }

    playWater(x, y) {
        if (this.waterEmitter && typeof this.waterEmitter.explode === 'function') {
            this.waterEmitter.explode(15, x, y);
        }
        let water = this.scene.add.text(x, y, '➖脫水💧 H₂O', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', backgroundColor: '#3498db', padding: { x: 8, y: 4 }, borderRadius: 4 }).setOrigin(0.5).setDepth(50);
        this.scene.tweens.add({ targets: water, y: y - 80, alpha: 0, duration: 1500, onComplete: () => water.destroy() });
    }

    // 【新增】呼叫氫鍵配對的顯示邏輯
    playHydrogenBond(x, y) {
        if (this.hBondEmitter && typeof this.hBondEmitter.explode === 'function') {
            this.hBondEmitter.explode(10, x, y);
        }
        let text = this.scene.add.text(x, y, '⚡ 氫鍵配對', { fontFamily: '"微軟正黑體", sans-serif', fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', backgroundColor: '#e67e22', padding: { x: 8, y: 4 }, borderRadius: 4 }).setOrigin(0.5).setDepth(50);
        this.scene.tweens.add({ targets: text, y: y - 80, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
    }
}
