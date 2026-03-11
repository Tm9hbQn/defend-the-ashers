import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export class BaseRenderer {
    constructor() {
        this.tier = 1; // 1-5
        this.damageFlash = 0;
        this.hp = 5;
        this.maxHp = 5;
    }

    setTier(level) {
        if (level <= 4) this.tier = 1;
        else if (level <= 8) this.tier = 2;
        else if (level <= 12) this.tier = 3;
        else if (level <= 16) this.tier = 4;
        else this.tier = 5;
    }

    flashDamage() {
        this.damageFlash = 1;
    }

    update(dt) {
        if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 4);
    }

    draw(ctx, W, H) {
        const baseY = H - 80;
        const centerX = W / 2;

        ctx.save();

        // Ground
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, H - 35, W, 35);

        // Damage flash overlay
        if (this.damageFlash > 0) {
            ctx.globalAlpha = this.damageFlash * 0.3;
            ctx.fillStyle = '#d63031';
            ctx.fillRect(0, baseY - 40, W, H - baseY + 40);
            ctx.globalAlpha = 1;
        }

        switch(this.tier) {
            case 1: this._drawTier1(ctx, centerX, baseY, W); break;
            case 2: this._drawTier2(ctx, centerX, baseY, W); break;
            case 3: this._drawTier3(ctx, centerX, baseY, W); break;
            case 4: this._drawTier4(ctx, centerX, baseY, W); break;
            case 5: this._drawTier5(ctx, centerX, baseY, W); break;
        }

        // Launcher (always on top)
        this._drawLauncher(ctx, centerX, baseY);

        // HP sections (visual damage)
        this._drawHPSections(ctx, centerX, baseY, W);

        ctx.restore();
    }

    _drawLauncher(ctx, cx, baseY) {
        // Launcher base
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(cx - 20, baseY - 15, 40, 20);
        // Barrel
        ctx.fillStyle = '#636e72';
        ctx.fillRect(cx - 4, baseY - 35, 8, 25);
        // Tip
        ctx.fillStyle = '#d63031';
        ctx.fillRect(cx - 5, baseY - 38, 10, 5);
        // Base circle
        ctx.fillStyle = '#b2bec3';
        ctx.beginPath();
        ctx.arc(cx, baseY - 8, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawHPSections(ctx, cx, baseY, W) {
        // Draw HP bar
        const barW = 100;
        const barH = 6;
        const barX = cx - barW / 2;
        const barY = baseY + 12;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        const ratio = this.hp / this.maxHp;
        const color = ratio > 0.6 ? '#00b894' : ratio > 0.3 ? '#e17055' : '#d63031';
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barW * ratio, barH);
    }

    _drawTier1(ctx, cx, baseY, W) {
        // Simple bunker
        ctx.fillStyle = '#636e72';
        ctx.fillRect(cx - 40, baseY - 10, 80, 25);
        // Sandbags
        ctx.fillStyle = '#7f8c8d';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(cx - 36 + i * 18, baseY + 12, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Small flag
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 30, baseY - 10);
        ctx.lineTo(cx + 30, baseY - 30);
        ctx.stroke();
        ctx.fillStyle = '#d63031';
        ctx.fillRect(cx + 30, baseY - 30, 12, 8);
    }

    _drawTier2(ctx, cx, baseY, W) {
        // Reinforced walls
        ctx.fillStyle = '#57606f';
        ctx.fillRect(cx - 55, baseY - 12, 110, 27);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(cx - 50, baseY - 15, 100, 20);
        // Rivets
        ctx.fillStyle = '#b2bec3';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc(cx - 42 + i * 12, baseY - 5, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Radar dish
        const time = Date.now() / 2000;
        ctx.save();
        ctx.translate(cx - 25, baseY - 20);
        ctx.rotate(Math.sin(time) * 0.5);
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 8, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
        ctx.fillStyle = '#b2bec3';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Flag
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 40, baseY - 12);
        ctx.lineTo(cx + 40, baseY - 38);
        ctx.stroke();
        ctx.fillStyle = '#d63031';
        ctx.fillRect(cx + 40, baseY - 38, 15, 10);
    }

    _drawTier3(ctx, cx, baseY, W) {
        // Multiple structures
        ctx.fillStyle = '#57606f';
        ctx.fillRect(cx - 70, baseY - 10, 140, 25);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(cx - 65, baseY - 18, 130, 22);
        // Side buildings
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(cx - 75, baseY - 8, 20, 22);
        ctx.fillRect(cx + 55, baseY - 8, 20, 22);
        // Comm tower
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 50, baseY - 18);
        ctx.lineTo(cx + 50, baseY - 45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 46, baseY - 40);
        ctx.lineTo(cx + 54, baseY - 40);
        ctx.stroke();
        ctx.moveTo(cx + 47, baseY - 35);
        ctx.lineTo(cx + 53, baseY - 35);
        ctx.stroke();
        // Spotlight sweep
        const time = Date.now() / 1500;
        const spotAngle = Math.sin(time) * 0.6 - Math.PI / 2;
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        ctx.moveTo(cx - 50, baseY - 18);
        ctx.lineTo(cx - 50 + Math.cos(spotAngle - 0.15) * 120, baseY - 18 + Math.sin(spotAngle - 0.15) * 120);
        ctx.lineTo(cx - 50 + Math.cos(spotAngle + 0.15) * 120, baseY - 18 + Math.sin(spotAngle + 0.15) * 120);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        // Ammo crates
        ctx.fillStyle = '#4b5320';
        ctx.fillRect(cx + 20, baseY + 2, 10, 8);
        ctx.fillRect(cx + 32, baseY + 2, 10, 8);
    }

    _drawTier4(ctx, cx, baseY, W) {
        // Fortress
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(cx - 85, baseY - 8, 170, 25);
        ctx.fillStyle = '#57606f';
        ctx.fillRect(cx - 80, baseY - 22, 160, 26);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(cx - 70, baseY - 25, 140, 20);
        // Rivets
        ctx.fillStyle = '#9ca3af';
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(cx - 65 + i * 11, baseY - 15, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Embrasures
        ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(cx - 55 + i * 30, baseY - 22, 8, 5);
        }
        // Shield glow
        ctx.save();
        const time = Date.now() / 800;
        ctx.globalAlpha = 0.06 + Math.sin(time) * 0.03;
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, baseY - 10, 90, -Math.PI, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
        // Radar arrays
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1;
        [-60, 60].forEach(xOff => {
            ctx.beginPath();
            ctx.moveTo(cx + xOff, baseY - 22);
            ctx.lineTo(cx + xOff, baseY - 35);
            ctx.stroke();
            const rot = Math.sin(Date.now() / 1000 + xOff) * 0.4;
            ctx.save();
            ctx.translate(cx + xOff, baseY - 35);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.arc(0, 0, 5, -Math.PI * 0.7, -Math.PI * 0.3);
            ctx.stroke();
            ctx.restore();
        });
    }

    _drawTier5(ctx, cx, baseY, W) {
        // Citadel
        ctx.fillStyle = '#3b4252';
        ctx.fillRect(cx - 95, baseY - 5, 190, 22);
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(cx - 90, baseY - 20, 180, 25);
        ctx.fillStyle = '#57606f';
        ctx.fillRect(cx - 80, baseY - 30, 160, 22);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(cx - 60, baseY - 35, 120, 18);

        // Energy core window
        const time = Date.now() / 500;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(cx - 8, baseY - 30, 16, 12);
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(time) * 0.3;
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(cx - 6, baseY - 28, 12, 8);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Shield
        ctx.save();
        ctx.globalAlpha = 0.1 + Math.sin(time * 0.7) * 0.05;
        const grad = ctx.createRadialGradient(cx, baseY - 15, 10, cx, baseY - 15, 100);
        grad.addColorStop(0, 'rgba(116, 185, 255, 0.3)');
        grad.addColorStop(1, 'rgba(116, 185, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, baseY - 15, 100, -Math.PI, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // Perimeter sparks
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 3; i++) {
            const sparkTime = (time * 2 + i * 2.5) % 8;
            if (sparkTime < 0.3) {
                const sx = cx - 80 + (sparkTime / 0.3) * 160;
                const sy = baseY - 30 + Math.random() * 5;
                ctx.fillStyle = '#ffeaa7';
                ctx.fillRect(sx, sy, 2, 2);
            }
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // Multiple flags
        ctx.strokeStyle = '#b2bec3';
        ctx.lineWidth = 1.5;
        [-70, 0, 70].forEach((xOff, i) => {
            ctx.beginPath();
            ctx.moveTo(cx + xOff, baseY - (i === 1 ? 35 : 20));
            ctx.lineTo(cx + xOff, baseY - (i === 1 ? 55 : 42));
            ctx.stroke();
            ctx.fillStyle = i === 1 ? '#ffeaa7' : '#d63031';
            ctx.fillRect(cx + xOff, baseY - (i === 1 ? 55 : 42), 10, 7);
        });
    }
}
