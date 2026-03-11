import { lerp } from './utils.js';

// Expressions: 'smug', 'laugh', 'furious', 'shocked', 'scheming', 'panicked', 'defeated'
export class VillainFace {
    constructor() {
        this.expression = 'smug';
        this.targetExpression = 'smug';
        this.transitionTime = 0;
        this.transitionDuration = 0.3;

        // Animated properties (0-1 ranges)
        this.mouthOpen = 0.3;
        this.eyeSize = 1;
        this.browAngle = 0;
        this.browY = 0;
        this.faceRed = 0;
        this.sweat = 0;
        this.shakeAmount = 0;
        this.laughTimer = 0;

        // Target values
        this.targets = {};
        this._setTargets('smug');
    }

    _setTargets(expr) {
        const presets = {
            smug:     { mouthOpen:0.3, eyeSize:0.8, browAngle:0.15, browY:0, faceRed:0, sweat:0, shakeAmount:0 },
            laugh:    { mouthOpen:0.9, eyeSize:1.2, browAngle:0.1, browY:-0.1, faceRed:0.1, sweat:0, shakeAmount:2 },
            furious:  { mouthOpen:0.4, eyeSize:0.7, browAngle:-0.4, browY:-0.15, faceRed:0.5, sweat:0, shakeAmount:1 },
            shocked:  { mouthOpen:0.8, eyeSize:1.6, browAngle:0.3, browY:-0.2, faceRed:0, sweat:0.5, shakeAmount:0 },
            scheming: { mouthOpen:0.2, eyeSize:0.6, browAngle:-0.2, browY:0, faceRed:0, sweat:0, shakeAmount:0 },
            panicked: { mouthOpen:0.6, eyeSize:1.4, browAngle:0.3, browY:-0.15, faceRed:0, sweat:1, shakeAmount:1.5 },
            defeated: { mouthOpen:0.5, eyeSize:1.1, browAngle:0.35, browY:-0.1, faceRed:0, sweat:0.8, shakeAmount:0.5 },
        };
        this.targets = presets[expr] || presets.smug;
    }

    setExpression(expr, duration = 0.3) {
        if (expr === this.targetExpression) return;
        this.targetExpression = expr;
        this._setTargets(expr);
        this.transitionTime = 0;
        this.transitionDuration = duration;
        if (expr === 'laugh') this.laughTimer = 0;
    }

    // Temporary expression that reverts
    flash(expr, duration = 1) {
        const prev = this.targetExpression;
        this.setExpression(expr, 0.15);
        this._revertTimeout = { expr: prev, time: duration };
    }

    update(dt) {
        // Lerp to targets
        const t = Math.min(1, dt * 6);
        this.mouthOpen = lerp(this.mouthOpen, this.targets.mouthOpen, t);
        this.eyeSize = lerp(this.eyeSize, this.targets.eyeSize, t);
        this.browAngle = lerp(this.browAngle, this.targets.browAngle, t);
        this.browY = lerp(this.browY, this.targets.browY, t);
        this.faceRed = lerp(this.faceRed, this.targets.faceRed, t);
        this.sweat = lerp(this.sweat, this.targets.sweat, t);
        this.shakeAmount = lerp(this.shakeAmount, this.targets.shakeAmount, t);

        if (this.targetExpression === 'laugh') {
            this.laughTimer += dt;
            this.mouthOpen = 0.6 + Math.sin(this.laughTimer * 12) * 0.3;
        }

        // Revert timer
        if (this._revertTimeout) {
            this._revertTimeout.time -= dt;
            if (this._revertTimeout.time <= 0) {
                this.setExpression(this._revertTimeout.expr, 0.3);
                this._revertTimeout = null;
            }
        }
    }

    draw(ctx, x, y, size) {
        ctx.save();
        const shakeX = (Math.random() - 0.5) * this.shakeAmount;
        const shakeY = (Math.random() - 0.5) * this.shakeAmount;
        ctx.translate(x + shakeX, y + shakeY);

        const s = size;
        const half = s / 2;

        // Keffiyeh / headwrap
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(0, -half * 0.1, half * 1.15, -Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#dfe6e9';
        ctx.beginPath();
        ctx.arc(0, -half * 0.15, half * 1.05, -Math.PI * 0.9, -Math.PI * 0.1);
        ctx.fill();

        // Face
        const faceR = lerp(0.93, 1, this.faceRed);
        const faceG = lerp(0.84, 0.4, this.faceRed);
        const faceB = lerp(0.62, 0.3, this.faceRed);
        ctx.fillStyle = `rgb(${Math.floor(faceR*255)},${Math.floor(faceG*255)},${Math.floor(faceB*255)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, half * 0.85, half * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        // Beard
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.ellipse(0, half * 0.45, half * 0.6, half * 0.55, 0, 0, Math.PI);
        ctx.fill();

        // Eyes
        const eyeSpacing = half * 0.35;
        const eyeY = -half * 0.15;
        const eyeR = half * 0.13 * this.eyeSize;
        // Whites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY, eyeR * 1.3, eyeR * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY, eyeR * 1.3, eyeR * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, eyeR * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, eyeR * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        // Left brow
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing - eyeR * 1.2, eyeY - eyeR * 1.2 + this.browY * half + this.browAngle * half * 0.3);
        ctx.lineTo(-eyeSpacing + eyeR * 1.2, eyeY - eyeR * 1.2 + this.browY * half - this.browAngle * half * 0.3);
        ctx.stroke();
        // Right brow
        ctx.beginPath();
        ctx.moveTo(eyeSpacing - eyeR * 1.2, eyeY - eyeR * 1.2 + this.browY * half - this.browAngle * half * 0.3);
        ctx.lineTo(eyeSpacing + eyeR * 1.2, eyeY - eyeR * 1.2 + this.browY * half + this.browAngle * half * 0.3);
        ctx.stroke();

        // Nose
        ctx.strokeStyle = '#c8a070';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, eyeY + eyeR);
        ctx.lineTo(-half * 0.08, half * 0.15);
        ctx.lineTo(half * 0.06, half * 0.18);
        ctx.stroke();

        // Mouth
        const mouthY = half * 0.2;
        const mouthW = half * 0.45;
        const mouthH = half * 0.15 * this.mouthOpen;
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        if (this.mouthOpen > 0.5) {
            ctx.ellipse(0, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
        } else {
            ctx.moveTo(-mouthW, mouthY);
            ctx.quadraticCurveTo(0, mouthY + mouthH * 3, mouthW, mouthY);
        }
        ctx.fill();

        // Teeth (when mouth open)
        if (this.mouthOpen > 0.5) {
            ctx.fillStyle = '#dfe6e9';
            ctx.fillRect(-mouthW * 0.6, mouthY - mouthH * 0.3, mouthW * 1.2, mouthH * 0.3);
        }

        // Sweat drops
        if (this.sweat > 0.2) {
            ctx.globalAlpha = this.sweat;
            ctx.fillStyle = '#74b9ff';
            const sweatX = half * 0.65;
            const time = Date.now() / 500;
            ctx.beginPath();
            ctx.ellipse(sweatX, eyeY + Math.sin(time) * 5, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(-sweatX + 5, eyeY + 5 + Math.cos(time * 1.3) * 4, 1.5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Tears (defeated)
        if (this.targetExpression === 'defeated') {
            ctx.fillStyle = '#74b9ff';
            const time = Date.now() / 300;
            for (let i = 0; i < 3; i++) {
                const ty = eyeY + eyeR + ((time + i * 4) % 12);
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.ellipse(-eyeSpacing, ty, 1.5, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(eyeSpacing, ty + 2, 1.5, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }
}
