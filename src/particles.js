import { lerp, randRange } from './utils.js';

const MAX_PARTICLES = 600;

class Particle {
    constructor() { this.active = false; }

    init(x, y, vx, vy, life, size, color, gravity = 0, drag = 0.98) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.size = size; this.color = color;
        this.gravity = gravity;
        this.drag = drag;
        this.active = true;
        this.alpha = 1;
        return this;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) { this.active = false; return; }
        this.vy += this.gravity * dt;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        this.size *= 0.998;
    }

    draw(ctx) {
        if (!this.active || this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.particles.push(new Particle());
        }
    }

    _get() {
        for (const p of this.particles) {
            if (!p.active) return p;
        }
        return null; // pool exhausted
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            const p = this._get();
            if (!p) return;
            const ang = config.angle !== undefined ? config.angle + (Math.random()-0.5) * (config.spread || Math.PI*2) : Math.random() * Math.PI * 2;
            const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
            const vx = Math.cos(ang) * speed;
            const vy = Math.sin(ang) * speed;
            const life = config.lifeMin + Math.random() * (config.lifeMax - config.lifeMin);
            const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
            const color = Array.isArray(config.colors) ? config.colors[Math.floor(Math.random() * config.colors.length)] : config.colors;
            p.init(x, y, vx, vy, life, size, color, config.gravity || 0, config.drag || 0.98);
        }
    }

    explosion(x, y, size = 1) {
        this.emit(x, y, Math.floor(40 * size), {
            speedMin: 60, speedMax: 250 * size,
            lifeMin: 0.3, lifeMax: 0.8,
            sizeMin: 1.5, sizeMax: 4 * size,
            colors: ['#fdcb6e', '#e17055', '#d63031', '#ffeaa7', '#ffffff', '#ff7675'],
            gravity: 120, drag: 0.96
        });
        // Smoke
        this.emit(x, y, Math.floor(8 * size), {
            speedMin: 20, speedMax: 60,
            lifeMin: 0.6, lifeMax: 1.2,
            sizeMin: 4, sizeMax: 8,
            colors: ['#636e72', '#b2bec3', '#dfe6e9'],
            gravity: -30, drag: 0.95
        });
    }

    missileTrail(x, y, isEnemy) {
        const p = this._get();
        if (!p) return;
        const colors = isEnemy
            ? ['#e17055', '#d63031', '#ff7675']
            : ['#74b9ff', '#a29bfe', '#ffffff'];
        p.init(
            x + (Math.random()-0.5)*3,
            y + (Math.random()-0.5)*3,
            (Math.random()-0.5)*15, (Math.random()-0.5)*15,
            isEnemy ? 0.4 : 0.3,
            isEnemy ? 2.5 : 2,
            colors[Math.floor(Math.random()*colors.length)],
            0, 0.96
        );
    }

    baseHit(x, y) {
        this.emit(x, y, 25, {
            angle: -Math.PI/2, spread: Math.PI * 0.8,
            speedMin: 80, speedMax: 200,
            lifeMin: 0.4, lifeMax: 0.9,
            sizeMin: 2, sizeMax: 5,
            colors: ['#636e72', '#b2bec3', '#d63031', '#e17055'],
            gravity: 250, drag: 0.97
        });
    }

    scorePopup(x, y) {
        this.emit(x, y, 5, {
            speedMin: 30, speedMax: 80,
            lifeMin: 0.3, lifeMax: 0.5,
            sizeMin: 1, sizeMax: 2.5,
            colors: ['#ffeaa7', '#fdcb6e'],
            gravity: -50, drag: 0.95
        });
    }

    celebration(x, y) {
        this.emit(x, y, 80, {
            speedMin: 100, speedMax: 350,
            lifeMin: 0.8, lifeMax: 1.5,
            sizeMin: 2, sizeMax: 5,
            colors: ['#fdcb6e', '#e17055', '#00b894', '#74b9ff', '#a29bfe', '#ffeaa7', '#ff7675', '#ffffff'],
            gravity: 150, drag: 0.97
        });
    }

    update(dt) {
        for (const p of this.particles) {
            if (p.active) p.update(dt);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            if (p.active) p.draw(ctx);
        }
    }
}
