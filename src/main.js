import { GAME_WIDTH, GAME_HEIGHT, COLORS, BASE_INTERCEPTOR_SPEED, BASE_RELOAD_COOLDOWN, BASE_EXPLOSION_RADIUS, BASE_MAX_INTERCEPTORS, BASE_HP, SCORE } from './constants.js';
import { lerp, clamp, dist, angle, randRange, randInt, easeOutCubic, easeOutElastic, rgbaStr } from './utils.js';
import { InputManager } from './input.js';
import { ScreenShake } from './screenshake.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';
import { VillainFace } from './villain.js';
import { BaseRenderer } from './base.js';
import { LEVELS } from './levels.js';
import { BOOSTS } from './boosts.js';
import { fetchLeaderboard, submitScore } from './supabase.js';

// ─── Canvas Setup ────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('ui-overlay');

let W, H, scale;
function resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // On landscape/desktop: use full height, compute width from aspect ratio
    // On portrait/mobile: use full width, compute height
    const targetAspect = GAME_WIDTH / GAME_HEIGHT; // ~0.556
    let displayW, displayH;

    if (vw / vh < targetAspect) {
        // Screen is narrower than game (portrait mobile)
        displayW = vw;
        displayH = vw / targetAspect;
    } else {
        // Screen is wider than game (desktop/landscape)
        displayH = vh;
        displayW = vh * targetAspect;
    }

    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    W = GAME_WIDTH;
    H = GAME_HEIGHT;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = dpr;
}
window.addEventListener('resize', resize);
resize();

// ─── Systems ─────────────────────────────────
const input = new InputManager(canvas);
const shake = new ScreenShake();
const particles = new ParticleSystem();
const audio = new AudioManager();
const villain = new VillainFace();
const baseRenderer = new BaseRenderer();

// ─── Player Identity ─────────────────────────
// Persists for this browser session; survives page reload (sessionStorage)
let playerName = sessionStorage.getItem('mc_playerName') || '';
let leaderboard = []; // top 10 from DB, refreshed on menu load
let leaderboardLoading = false;
let sessionHighScore = 0; // track if current session beat the personal record

// ─── Player Stats ────────────────────────────
const stats = {
    firepower: 0,
    reload: 0,
    speed: 0,
    maxInterceptors: 0,
    morale: 0,
    hp: BASE_HP,
    maxHp: BASE_HP,
    score: 0,
    level: 1,
    highestLevel: parseInt(localStorage.getItem('mc_highLevel') || '1'),
};

function getInterceptorSpeed() { return BASE_INTERCEPTOR_SPEED + stats.speed * 90; }
function getReloadCooldown() { return Math.max(0.08, BASE_RELOAD_COOLDOWN - stats.reload * 0.05); }
function getExplosionRadius() { return BASE_EXPLOSION_RADIUS + stats.firepower * 12; }
function getMaxInterceptors() { return BASE_MAX_INTERCEPTORS + stats.maxInterceptors; }
function getScoreMult() { return 1 + stats.morale * 0.2; }

// ─── Entities ────────────────────────────────
let interceptors = [];
let enemyMissiles = [];
let explosions = [];
let scorePopups = [];
let reloadTimer = 0;
let waveTimer = 0;
let currentWaveIdx = 0;
let waveMissileIdx = 0;
let levelMissileQueue = [];
let levelComplete = false;
let levelTimer = 0;
let totalEnemiesThisLevel = 0;
let enemiesReachedBase = 0;
let flashAlpha = 0;
let lastTapX = -100, lastTapY = -100, lastTapTimer = 0;

class Interceptor {
    constructor(x, y, tx, ty) {
        this.x = x; this.y = y;
        this.tx = tx; this.ty = ty;
        const d = dist(x, y, tx, ty);
        const spd = getInterceptorSpeed();
        const a = angle(x, y, tx, ty);
        this.vx = Math.cos(a) * spd;
        this.vy = Math.sin(a) * spd;
        this.travelTime = d / spd;
        this.elapsed = 0;
        this.active = true;
        this.trail = [];
    }
    update(dt) {
        this.elapsed += dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.trail.push({ x: this.x, y: this.y, life: 0.25 });
        if (this.trail.length > 20) this.trail.shift();
        // Emit trail particles
        particles.missileTrail(this.x, this.y, false);
        if (this.elapsed >= this.travelTime) {
            this.active = false;
            detonate(this.x, this.y);
        }
    }
    draw(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const a = (i / this.trail.length) * 0.4;
            ctx.globalAlpha = a;
            ctx.fillStyle = COLORS.interceptorTrail;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Missile body
        ctx.fillStyle = COLORS.interceptor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = COLORS.interceptorTrail;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class EnemyMissile {
    constructor(x, speed, type = 'standard') {
        this.x = x * W;
        this.y = -10;
        this.speed = speed;
        this.type = type;
        this.active = true;
        this.hp = type === 'heavy' ? 2 : 1;
        this.baseX = this.x;
        this.elapsed = 0;
        this.splitDone = false;
        this.fadeStart = -1;
        this.warheads = 5;
        this.radius = type === 'heavy' ? 5 : type === 'mirv' ? 8 : 3;
        this.scored = false;
    }
    update(dt) {
        this.elapsed += dt;
        this.y += this.speed * dt;

        if (this.type === 'zigzag') {
            this.x = this.baseX + Math.sin(this.elapsed * 4) * 25;
        }

        // Cluster split at 55% travel
        if (this.type === 'cluster' && !this.splitDone && this.y > H * 0.5) {
            this.splitDone = true;
            this.active = false;
            // Spawn 3 sub-missiles
            for (let i = 0; i < 3; i++) {
                const sub = new EnemyMissile(0, this.speed * 1.1, 'standard');
                sub.x = this.x + (i - 1) * 25;
                sub.y = this.y;
                sub.scored = false;
                enemyMissiles.push(sub);
            }
            particles.explosion(this.x, this.y, 0.3);
            audio.playExplosion(false);
            return;
        }

        // MIRV split at 50%
        if (this.type === 'mirv' && !this.splitDone && this.y > H * 0.4) {
            this.splitDone = true;
            this.active = false;
            const count = this.warheads || 5;
            for (let i = 0; i < count; i++) {
                const sub = new EnemyMissile(0, this.speed * 1.5 + randRange(-15, 15), 'fast');
                sub.x = this.x + (i - count/2) * 20;
                sub.y = this.y;
                sub.scored = false;
                enemyMissiles.push(sub);
            }
            particles.explosion(this.x, this.y, 1.5);
            shake.trigger(8, 0.4);
            audio.playExplosion(true);
            // Score for MIRV parent
            addScore(this.x, this.y, SCORE.mirv);
            villain.flash('shocked', 1.5);
            return;
        }

        // Decoy fade at 65%
        if (this.type === 'decoy' && this.fadeStart < 0 && this.y > H * 0.55) {
            this.fadeStart = this.elapsed;
        }
        if (this.type === 'decoy' && this.fadeStart > 0) {
            const fadeTime = this.elapsed - this.fadeStart;
            if (fadeTime > 0.6) {
                this.active = false;
                return;
            }
        }

        // Trail particles
        if (Math.random() < 0.6) particles.missileTrail(this.x, this.y, true);

        // Hit base
        if (this.y >= H - 80) {
            this.active = false;
            if (this.type !== 'decoy') {
                const dmg = this.type === 'heavy' ? 2 : 1;
                damageBase(dmg, this.x);
                enemiesReachedBase++;
            }
        }
    }
    draw(ctx) {
        let alpha = 1;
        if (this.type === 'decoy' && this.fadeStart > 0) {
            alpha = 1 - (this.elapsed - this.fadeStart) / 0.6;
        }
        ctx.globalAlpha = alpha;

        const r = this.radius;
        // Glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = this.type === 'heavy' ? '#e74c3c' : this.type === 'mirv' ? '#e056fd' : this.type === 'decoy' ? '#95a5a6' : COLORS.enemyBody;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha;
        // Body
        ctx.fillStyle = this.type === 'heavy' ? '#c0392b' : this.type === 'mirv' ? '#8e44ad' : this.type === 'decoy' ? '#7f8c8d' : COLORS.enemyBody;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Heavy: armor ring
        if (this.type === 'heavy') {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r + 2, 0, Math.PI * 2);
            ctx.stroke();
            // HP pips
            ctx.fillStyle = '#ffeaa7';
            for (let i = 0; i < this.hp; i++) {
                ctx.fillRect(this.x - 4 + i * 5, this.y - r - 6, 3, 3);
            }
        }

        // MIRV: warning icon
        if (this.type === 'mirv') {
            ctx.fillStyle = '#ffeaa7';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x, this.y + 3);
        }

        ctx.globalAlpha = 1;
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.maxRadius = getExplosionRadius();
        this.radius = 5;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.active = true;
        this.chainKills = 0;
    }
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) { this.active = false; return; }
        const progress = 1 - this.life / this.maxLife;
        if (progress < 0.4) {
            this.radius = lerp(5, this.maxRadius, easeOutCubic(progress / 0.4));
        } else {
            this.radius = lerp(this.maxRadius, 0, (progress - 0.4) / 0.6);
        }
    }
    draw(ctx) {
        const progress = 1 - this.life / this.maxLife;
        const alpha = progress < 0.3 ? 1 : 1 - (progress - 0.3) / 0.7;

        // Outer glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = COLORS.explosionOuter;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Main explosion
        ctx.globalAlpha = alpha * 0.7;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, COLORS.explosionInner);
        grad.addColorStop(0.5, COLORS.explosionMid);
        grad.addColorStop(1, COLORS.explosionOuter);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Shockwave ring
        if (progress < 0.5) {
            ctx.globalAlpha = (0.5 - progress) * 2 * 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.3, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }
}

// ─── Game Actions ────────────────────────────
function detonate(x, y) {
    const exp = new Explosion(x, y);
    explosions.push(exp);
    particles.explosion(x, y, 1 + stats.firepower * 0.15);
    shake.trigger(4 + stats.firepower, 0.2);
    audio.playExplosion(true);
    flashAlpha = 0.15;
}

function addScore(x, y, points) {
    const mult = getScoreMult();
    const total = Math.floor(points * mult);
    stats.score += total;
    scorePopups.push({ x, y, text: '+' + total, life: 1, vy: -40 });
    particles.scorePopup(x, y);
}

function damageBase(amount, x) {
    stats.hp = Math.max(0, stats.hp - amount);
    baseRenderer.hp = stats.hp;
    baseRenderer.maxHp = stats.maxHp;
    baseRenderer.flashDamage();
    shake.trigger(6, 0.3);
    particles.baseHit(x || W / 2, H - 80);
    audio.playBaseHit();
    villain.flash('laugh', 1.2);
    if (stats.hp <= 0) {
        changeState('gameover');
    }
}

function checkCollisions() {
    for (const exp of explosions) {
        if (!exp.active) continue;
        let killsThisFrame = 0;
        for (const em of enemyMissiles) {
            if (!em.active || em.type === 'decoy') continue;
            const d = dist(exp.x, exp.y, em.x, em.y);
            if (d < exp.radius + em.radius) {
                em.hp--;
                if (em.hp <= 0) {
                    em.active = false;
                    killsThisFrame++;
                    exp.chainKills++;
                    // Score based on type
                    let pts = SCORE[em.type] || SCORE.standard;
                    if (exp.chainKills > 1) pts = Math.floor(pts * Math.pow(SCORE.chainBonus, exp.chainKills - 1));
                    addScore(em.x, em.y, pts);
                    particles.explosion(em.x, em.y, 0.4);
                    audio.playExplosion(false);
                }
            }
        }
        if (killsThisFrame >= 3) {
            villain.flash('furious', 1.5);
        } else if (killsThisFrame >= 2) {
            villain.flash('shocked', 1);
        }
    }
}

// ─── State Machine ───────────────────────────
let gameState = 'menu';
let stateTimer = 0;
let prevState = '';

function changeState(newState) {
    prevState = gameState;
    gameState = newState;
    stateTimer = 0;
    overlay.innerHTML = '';

    if (newState === 'menu') setupMenu();
    else if (newState === 'playing') setupLevel();
    else if (newState === 'boost') setupBoostChoice();
    else if (newState === 'gameover') setupGameOver();
    else if (newState === 'victory') setupVictory();
}

// ─── NAME PROMPT ─────────────────────────────
function showNamePrompt(onDone) {
    overlay.style.display = 'flex';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '9999';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(10,10,26,0.98)';

    overlay.innerHTML = `
        <div style="text-align:center;">
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:28px;font-weight:900;color:#ffeaa7;margin-bottom:8px;letter-spacing:2px;">COMMANDER</div>
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#b2bec3;margin-bottom:30px;">What's your name, soldier?</div>
            <input id="nameInput" maxlength="20" placeholder="Enter name..."
                style="font-family:'Segoe UI',Arial,sans-serif;font-size:20px;font-weight:700;color:#ffeaa7;background:rgba(255,234,167,0.08);border:2px solid rgba(255,234,167,0.3);border-radius:10px;padding:12px 20px;width:220px;text-align:center;outline:none;caret-color:#ffeaa7;margin-bottom:20px;"
                autocomplete="off" autocorrect="off" spellcheck="false" autofocus>
            <div id="nameOkBtn" style="font-family:'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a2e;background:#ffeaa7;padding:12px 40px;border-radius:10px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;opacity:0.4;transition:opacity 0.2s;">CONFIRM</div>
        </div>
    `;

    const submit = () => {
        const inp = document.getElementById('nameInput');
        const name = inp ? inp.value.trim() : '';
        if (!name) return;
        playerName = name;
        sessionStorage.setItem('mc_playerName', name);
        onDone();
    };

    setTimeout(() => {
        const inp = document.getElementById('nameInput');
        const btn = document.getElementById('nameOkBtn');

        if (!inp || !btn) {
            console.warn('Name prompt elements not found');
            return;
        }

        inp.focus();

        const validate = () => {
            const ok = inp.value.trim().length >= 1;
            btn.style.opacity = ok ? '1' : '0.4';
            btn.style.cursor = ok ? 'pointer' : 'default';
        };

        validate(); // Initial validation
        inp.addEventListener('input', validate);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
        btn.addEventListener('click', submit);
    }, 0);
}

// ─── GUIDE / HOW TO PLAY ─────────────────────
function showGuide() {
    const F = 'font-family:\'Segoe UI\',Arial,sans-serif;';
    const steps = [
        {
            icon: '🎯',
            title: 'Tap to Fire',
            desc: 'Tap anywhere on screen to launch an interceptor missile toward that point. It detonates on arrival — time it to intercept enemy missiles mid-flight.',
            mock: `<div style="position:relative;width:120px;height:100px;margin:0 auto;">
                <div style="position:absolute;left:55px;top:5px;width:10px;height:22px;background:#e17055;border-radius:3px;box-shadow:0 0 6px #e17055;"></div>
                <div style="position:absolute;left:57px;top:38px;width:3px;height:30px;background:linear-gradient(#74b9ff,transparent);border-radius:2px;"></div>
                <div style="position:absolute;left:36px;top:60px;width:10px;height:22px;background:linear-gradient(#ffeaa7,#ffeaa7);border-radius:50%;box-shadow:0 0 12px #ffeaa7;"></div>
                <div style="position:absolute;bottom:6px;left:48px;width:24px;height:8px;background:#636e72;border-radius:4px;"></div>
                <div style="position:absolute;bottom:8px;left:54px;width:4px;height:10px;background:#b2bec3;border-radius:2px;"></div>
            </div>`
        },
        {
            icon: '💥',
            title: 'Lead Your Targets',
            desc: 'Your missiles travel in a straight line. Tap where the enemy missile WILL BE, not where it is now. The explosion expands and lingers — use it to catch multiple enemies.',
            mock: `<div style="position:relative;width:120px;height:100px;margin:0 auto;">
                <svg width="120" height="100" style="position:absolute;top:0;left:0;overflow:visible;">
                    <line x1="60" y1="95" x2="75" y2="30" stroke="#74b9ff" stroke-width="2" stroke-dasharray="4,3" opacity="0.6"/>
                    <circle cx="45" cy="60" r="4" fill="#e17055" style="filter:drop-shadow(0 0 4px #e17055)"/>
                    <circle cx="75" cy="30" r="16" fill="none" stroke="#fdcb6e" stroke-width="2" opacity="0.7"/>
                    <circle cx="75" cy="30" r="8" fill="#fdcb6e" opacity="0.4"/>
                    <text x="80" y="28" fill="#b2bec3" font-size="9" font-family="sans-serif">← aim here</text>
                </svg>
            </div>`
        },
        {
            icon: '🏚️',
            title: 'Protect Your Base',
            desc: 'Missiles that reach the bottom damage your base. You start with 8 HP. If it hits 0, game over. HP carries between levels — pick Repair boosts when hurt.',
            mock: `<div style="position:relative;width:120px;height:100px;margin:0 auto;">
                <svg width="120" height="100">
                    <rect x="30" y="55" width="60" height="20" fill="#636e72" rx="3"/>
                    <rect x="50" y="45" width="20" height="15" fill="#57606f" rx="2"/>
                    <rect x="53" y="35" width="4" height="14" fill="#b2bec3"/>
                    <circle cx="55" cy="33" r="4" fill="none" stroke="#d63031" stroke-width="2" opacity="0.8"/>
                    <rect x="5" y="64" width="50" height="6" fill="#1a1a2e" rx="2"/>
                    <rect x="5" y="64" width="30" height="6" fill="#00b894" rx="2"/>
                    <text x="5" y="58" fill="#b2bec3" font-size="8" font-family="sans-serif">HP BAR</text>
                </svg>
            </div>`
        },
        {
            icon: '⚡',
            title: 'Chain Kills = Big Score',
            desc: 'Time explosions to catch multiple missiles at once! Each extra kill in the same blast multiplies your score by 1.5×. Clearing a level without any hits gives +500 bonus.',
            mock: `<div style="position:relative;width:120px;height:100px;margin:0 auto;">
                <svg width="120" height="100">
                    <circle cx="60" cy="50" r="28" fill="#fdcb6e" opacity="0.15"/>
                    <circle cx="60" cy="50" r="18" fill="#fdcb6e" opacity="0.3"/>
                    <circle cx="60" cy="50" r="8" fill="#fdcb6e" opacity="0.7"/>
                    <circle cx="38" cy="35" r="4" fill="#e17055" style="filter:drop-shadow(0 0 3px #e17055)"/>
                    <circle cx="70" cy="30" r="4" fill="#e17055" style="filter:drop-shadow(0 0 3px #e17055)"/>
                    <circle cx="82" cy="52" r="4" fill="#e17055" style="filter:drop-shadow(0 0 3px #e17055)"/>
                    <text x="22" y="90" fill="#ffeaa7" font-size="10" font-family="sans-serif" font-weight="bold">×3 CHAIN! +450</text>
                </svg>
            </div>`
        },
        {
            icon: '🚀',
            title: 'Upgrade Between Levels',
            desc: 'After each level you choose 1 of 2 crazy upgrades. Firepower = bigger blasts. Reload = faster fire. Speed = faster missiles. Max Interceptors = more shots in flight. Morale = score multiplier.',
            mock: `<div style="display:flex;gap:8px;justify-content:center;margin-top:4px;">
                <div style="background:linear-gradient(135deg,#1e3a5f,#162d4a);border:1.5px solid #3498db;border-radius:10px;padding:8px 10px;text-align:center;width:52px;">
                    <div style="font-size:20px;">💣</div>
                    <div style="${F}font-size:8px;color:#fff;font-weight:700;margin-top:3px;">BIGGER<br>WARHEADS</div>
                    <div style="${F}font-size:8px;color:#00b894;margin-top:3px;">Fire +1</div>
                </div>
                <div style="background:linear-gradient(135deg,#3d1f5c,#2d1845);border:1.5px solid #9b59b6;border-radius:10px;padding:8px 10px;text-align:center;width:52px;">
                    <div style="font-size:20px;">☕</div>
                    <div style="${F}font-size:8px;color:#fff;font-weight:700;margin-top:3px;">CAFFEINE<br>IV DRIP</div>
                    <div style="${F}font-size:8px;color:#00b894;margin-top:3px;">Reload +1</div>
                </div>
            </div>`
        },
        {
            icon: '🚨',
            title: 'Enemy Types',
            desc: 'Standard (slow), Fast (speedy), Zigzag (dodgy), Cluster (splits into 3), Heavy (needs 2 hits), Decoy (fades out — save your ammo!), MIRV Boss (splits into 5–8 warheads).',
            mock: `<div style="display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;max-width:140px;margin:0 auto;">
                ${[['🔴','Standard'],['🟠','Fast'],['🌀','Zigzag'],['💢','Cluster'],['🟥','Heavy'],['👻','Decoy'],['💀','MIRV']].map(([e,n])=>`<div style="text-align:center;"><div style="font-size:16px;">${e}</div><div style="${F}font-size:7px;color:#b2bec3;">${n}</div></div>`).join('')}
            </div>`
        },
    ];

    let step = 0;
    function render() {
        const s = steps[step];
        overlay.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,10,26,0.97);z-index:30;animation:fadeIn 0.2s ease;padding:16px;box-sizing:border-box;">
                <!-- Back button -->
                <div id="guideBack" style="${F}position:absolute;top:16px;left:16px;font-size:13px;color:#636e72;cursor:pointer;padding:6px 10px;border:1px solid #2d3436;border-radius:8px;">← Menu</div>
                <!-- Step dots -->
                <div style="display:flex;gap:6px;margin-bottom:20px;">
                    ${steps.map((_,i)=>`<div style="width:7px;height:7px;border-radius:50%;background:${i===step?'#ffeaa7':'#2d3436'};transition:background 0.2s;"></div>`).join('')}
                </div>
                <!-- Icon + title -->
                <div style="font-size:40px;margin-bottom:8px;">${s.icon}</div>
                <div style="${F}font-size:20px;font-weight:900;color:#ffeaa7;text-align:center;margin-bottom:10px;">${s.title}</div>
                <!-- Mock visual -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid #2d3436;border-radius:12px;padding:14px;margin-bottom:14px;width:160px;min-height:110px;display:flex;align-items:center;justify-content:center;">
                    ${s.mock}
                </div>
                <!-- Description -->
                <div style="${F}font-size:13px;color:#b2bec3;text-align:center;line-height:1.6;max-width:300px;margin-bottom:24px;">${s.desc}</div>
                <!-- Nav buttons -->
                <div style="display:flex;gap:12px;">
                    ${step > 0 ? `<div id="guidePrev" style="${F}font-size:14px;font-weight:700;color:#b2bec3;background:rgba(255,255,255,0.06);padding:10px 24px;border-radius:10px;cursor:pointer;">PREV</div>` : ''}
                    <div id="guideNext" style="${F}font-size:14px;font-weight:700;color:#1a1a2e;background:#ffeaa7;padding:10px 28px;border-radius:10px;cursor:pointer;">${step < steps.length-1 ? 'NEXT' : 'GOT IT!'}</div>
                </div>
                <div style="${F}font-size:11px;color:#2d3436;margin-top:12px;">${step+1} / ${steps.length}</div>
            </div>
        `;
        document.getElementById('guideBack').addEventListener('click', () => setupMenu());
        document.getElementById('guideNext').addEventListener('click', () => {
            audio.playSelect();
            if (step < steps.length - 1) { step++; render(); }
            else setupMenu();
        });
        if (step > 0) document.getElementById('guidePrev').addEventListener('click', () => { audio.playSelect(); step--; render(); });
    }
    render();
}

// ─── MENU STATE ──────────────────────────────
function setupMenu() {
    stats.score = 0;
    stats.level = 1;
    stats.hp = BASE_HP;
    stats.maxHp = BASE_HP;
    stats.firepower = 0;
    stats.reload = 0;
    stats.speed = 0;
    stats.maxInterceptors = 0;
    stats.morale = 0;
    baseRenderer.hp = stats.hp;
    baseRenderer.maxHp = stats.maxHp;
    villain.setExpression('smug');

    // If no name yet, prompt first (do this BEFORE async fetch to avoid overlay conflicts)
    if (!playerName) {
        showNamePrompt(() => setupMenu());
        return;
    }

    // Refresh leaderboard in background (only if player has a name)
    leaderboardLoading = true;
    fetchLeaderboard().then(rows => {
        leaderboard = rows;
        leaderboardLoading = false;
        // Only re-render if still on menu (avoid overwriting other states)
        if (gameState === 'menu') {
            renderMenu();
        }
    });

    renderMenu();
}

function renderMenu() {
    const F = 'font-family:\'Segoe UI\',Arial,sans-serif;';
    const medal = ['🥇','🥈','🥉'];

    const lbHTML = leaderboard.length === 0 ? `
        <div style="${F}font-size:12px;color:#4b5563;text-align:center;padding:10px 0;">
            ${leaderboardLoading ? 'Loading scores...' : 'No scores yet — be the first!'}
        </div>
    ` : `
        ${leaderboard.slice(0,1).map((r,i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,234,167,0.1);margin-bottom:4px;">
                <span style="font-size:16px;margin-right:6px;">${medal[0]}</span>
                <span style="${F}font-size:15px;font-weight:900;color:#ffeaa7;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.player_name)}</span>
                <span style="${F}font-size:15px;font-weight:900;color:#ffeaa7;">${r.score.toLocaleString()}</span>
            </div>
        `).join('')}
        ${leaderboard.slice(1).map((r,i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;">
                <span style="${F}font-size:11px;color:#4b5563;width:18px;">${medal[i+1]||`${i+2}.`}</span>
                <span style="${F}font-size:11px;color:#b2bec3;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:6px;">${escapeHtml(r.player_name)}</span>
                <span style="${F}font-size:11px;color:#b2bec3;">${r.score.toLocaleString()}</span>
            </div>
        `).join('')}
    `;

    overlay.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,10,26,0.9);z-index:20;">
            <!-- Title — DEFEND the ASHERS poster style -->
            <div style="text-align:center;line-height:1;margin-bottom:12px;">
                <!-- Top line: DEFEND + small "the" -->
                <div style="display:flex;align-items:baseline;justify-content:center;gap:10px;margin-bottom:0px;">
                    <div style="font-family:Impact,'Arial Black',Haettenschweiler,sans-serif;font-size:clamp(38px,11vw,56px);font-weight:900;color:#ffeaa7;text-transform:uppercase;letter-spacing:3px;text-shadow:2px 2px 0 #9a7510,4px 4px 0 #7a5a0a,6px 6px 10px rgba(0,0,0,0.7);">DEFEND</div>
                    <div style="${F}font-size:clamp(15px,4vw,22px);font-weight:700;color:#e8cf7a;letter-spacing:2px;text-transform:lowercase;padding-bottom:4px;text-shadow:1px 1px 0 #7a5a0a;">the</div>
                </div>
                <!-- Bottom line: ASHERS — big, red, 3D extruded -->
                <div style="font-family:Impact,'Arial Black',Haettenschweiler,sans-serif;font-size:clamp(52px,16vw,80px);font-weight:900;color:#d63031;text-transform:uppercase;letter-spacing:2px;line-height:0.95;text-shadow:2px 2px 0 #9b0000,3px 3px 0 #8b0000,4px 4px 0 #7b0000,5px 5px 0 #6b0000,6px 6px 0 #5b0000,7px 7px 0 #4b0000,8px 8px 0 #3b0000,10px 10px 16px rgba(0,0,0,0.9);">ASHERS</div>
                <!-- Subtitle -->
                <div style="${F}font-size:12px;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:10px;margin-top:6px;">Last Stand</div>
            </div>
            <!-- Player greeting -->
            <div style="${F}font-size:12px;color:#4b5563;margin-bottom:16px;">
                Commander <span id="playerNameDisplay" style="color:#b2bec3;font-weight:700;cursor:pointer;text-decoration:underline dotted;">${escapeHtml(playerName)}</span>
                ${stats.highestLevel > 1 ? `&nbsp;· Best: Lvl ${stats.highestLevel}` : ''}
            </div>
            <!-- Leaderboard -->
            <div style="width:260px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,234,167,0.1);border-radius:12px;padding:10px 14px;margin-bottom:18px;">
                <div style="${F}font-size:10px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;">🏆 Hall of Fame</div>
                ${lbHTML}
            </div>
            <!-- Buttons -->
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
                <div id="howToBtn" style="${F}font-size:13px;font-weight:600;color:#b2bec3;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:10px 16px;border-radius:10px;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">How to Play</div>
                <div id="startBtn" style="${F}font-size:20px;font-weight:700;color:#1a1a2e;background:#ffeaa7;padding:13px 44px;border-radius:12px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;box-shadow:0 0 25px rgba(255,234,167,0.3);">START</div>
            </div>
            <!-- Mute -->
            <div id="muteBtn" style="position:fixed;bottom:18px;right:18px;font-size:22px;cursor:pointer;opacity:0.4;">${audio.muted ? '\u{1F507}' : '\u{1F50A}'}</div>
        </div>
    `;

    document.getElementById('startBtn').addEventListener('click', () => {
        audio.init(); audio.resume(); audio.playSelect();
        changeState('playing');
    });
    document.getElementById('howToBtn').addEventListener('click', () => {
        audio.playSelect(); showGuide();
    });
    document.getElementById('muteBtn').addEventListener('click', () => {
        audio.muted = !audio.muted;
        document.getElementById('muteBtn').textContent = audio.muted ? '\u{1F507}' : '\u{1F50A}';
    });
    document.getElementById('playerNameDisplay').addEventListener('click', () => {
        // Allow renaming
        showNamePrompt(() => setupMenu());
    });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ─── PLAYING STATE ───────────────────────────
function setupLevel() {
    interceptors = [];
    enemyMissiles = [];
    explosions = [];
    scorePopups = [];
    reloadTimer = 0;
    currentWaveIdx = 0;
    waveMissileIdx = 0;
    levelComplete = false;
    levelTimer = 0;
    enemiesReachedBase = 0;
    flashAlpha = 0;

    const levelDef = LEVELS[stats.level - 1];
    baseRenderer.setTier(stats.level);
    baseRenderer.hp = stats.hp;
    baseRenderer.maxHp = stats.maxHp;

    // Build missile queue
    levelMissileQueue = [];
    for (const wave of levelDef.waves) {
        for (const m of wave.missiles) {
            levelMissileQueue.push({
                spawnTime: wave.delay + (m.delay || 0),
                type: m.type,
                x: m.x,
                speed: m.speed,
                warheads: m.warheads,
            });
        }
    }
    levelMissileQueue.sort((a, b) => a.spawnTime - b.spawnTime);
    totalEnemiesThisLevel = levelMissileQueue.length;

    // Boss warning
    if (levelDef.isBoss) {
        audio.playBossWarning();
    }

    villain.setExpression(levelDef.isBoss ? 'scheming' : 'smug');

    // Set input handler
    input.onTap = (x, y) => {
        if (gameState !== 'playing') return;
        audio.resume();
        lastTapX = x; lastTapY = y; lastTapTimer = 0.4;
        if (y > H - 100) return;
        const activeCount = interceptors.filter(i => i.active).length;
        if (activeCount >= getMaxInterceptors()) return;
        if (reloadTimer > 0) return;
        const launcherX = W / 2;
        const launcherY = H - 115;
        interceptors.push(new Interceptor(launcherX, launcherY, x, y));
        reloadTimer = getReloadCooldown();
        audio.playLaunch();
    };
}

function updatePlaying(dt) {
    levelTimer += dt;

    // Spawn missiles from queue
    while (levelMissileQueue.length > 0 && levelMissileQueue[0].spawnTime <= levelTimer) {
        const m = levelMissileQueue.shift();
        const em = new EnemyMissile(m.x, m.speed, m.type);
        if (m.warheads) em.warheads = m.warheads;
        enemyMissiles.push(em);
    }

    // Update reload
    if (reloadTimer > 0) reloadTimer -= dt;

    // Update entities
    for (const i of interceptors) if (i.active) i.update(dt);
    for (const em of enemyMissiles) if (em.active) em.update(dt);
    for (const exp of explosions) if (exp.active) exp.update(dt);

    // Collisions
    checkCollisions();

    // Clean up
    interceptors = interceptors.filter(i => i.active);
    enemyMissiles = enemyMissiles.filter(em => em.active);
    explosions = explosions.filter(exp => exp.active);

    // Score popups
    for (const sp of scorePopups) {
        sp.life -= dt;
        sp.y += sp.vy * dt;
        sp.vy *= 0.95;
    }
    scorePopups = scorePopups.filter(sp => sp.life > 0);

    // Flash fade
    if (flashAlpha > 0) flashAlpha -= dt * 0.8;
    if (lastTapTimer > 0) lastTapTimer -= dt;

    // Check level complete
    if (!levelComplete && levelMissileQueue.length === 0 && enemyMissiles.length === 0 && explosions.length === 0) {
        levelComplete = true;
        // No damage bonus
        if (enemiesReachedBase === 0) {
            addScore(W / 2, H / 2, SCORE.noDamageBonus);
            villain.flash('shocked', 1.5);
        }

        // Save progress
        if (stats.level > stats.highestLevel) {
            stats.highestLevel = stats.level;
            localStorage.setItem('mc_highLevel', stats.level.toString());
        }

        setTimeout(() => {
            if (stats.level >= 20) {
                changeState('victory');
            } else {
                changeState('boost');
            }
        }, 1500);
    }

    // Update villain based on game state
    if (stats.level >= 18) villain.setExpression('panicked');
}

function drawPlaying(ctx) {
    const levelDef = LEVELS[stats.level - 1];
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (levelDef.isNight) {
        bgGrad.addColorStop(0, '#0a0a15');
        bgGrad.addColorStop(1, '#0d1520');
    } else {
        bgGrad.addColorStop(0, COLORS.bgTop);
        bgGrad.addColorStop(1, COLORS.bgBottom);
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5) % W;
        const sy = (i * 73.1) % (H * 0.5);
        const blink = Math.sin(Date.now() / 1000 + i * 0.7) * 0.5 + 0.5;
        ctx.globalAlpha = blink * 0.5;
        ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    shake.apply(ctx);

    // Base
    baseRenderer.draw(ctx, W, H);

    // Explosions (behind missiles)
    for (const exp of explosions) exp.draw(ctx);

    // Enemy missiles
    for (const em of enemyMissiles) em.draw(ctx);

    // Interceptors
    for (const i of interceptors) i.draw(ctx);

    // Particles
    particles.draw(ctx);

    ctx.restore();

    // Flash overlay
    if (flashAlpha > 0) {
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
    }

    // Tap crosshair
    if (lastTapTimer > 0) {
        const a = lastTapTimer / 0.4;
        ctx.globalAlpha = a * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        const sz = 8 + (1 - a) * 6;
        ctx.beginPath();
        ctx.moveTo(lastTapX - sz, lastTapY); ctx.lineTo(lastTapX + sz, lastTapY);
        ctx.moveTo(lastTapX, lastTapY - sz); ctx.lineTo(lastTapX, lastTapY + sz);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(lastTapX, lastTapY, sz * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Score popups
    for (const sp of scorePopups) {
        ctx.globalAlpha = sp.life;
        ctx.fillStyle = COLORS.scoreGold;
        ctx.font = 'bold 14px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sp.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;

    // HUD
    drawHUD(ctx);

    // Villain face
    villain.draw(ctx, W - 45, 55, 55);

    // Level name (at start)
    if (levelTimer < 2.5) {
        const alpha = levelTimer < 0.5 ? levelTimer / 0.5 : levelTimer > 2 ? (2.5 - levelTimer) / 0.5 : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffeaa7';
        ctx.font = 'bold 22px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${stats.level}`, W / 2, H * 0.3);
        ctx.fillStyle = '#dfe6e9';
        ctx.font = '16px Segoe UI, Arial, sans-serif';
        ctx.fillText(LEVELS[stats.level - 1].name, W / 2, H * 0.3 + 28);

        // Villain quote
        ctx.fillStyle = '#b2bec3';
        ctx.font = 'italic 12px Segoe UI, Arial, sans-serif';
        ctx.fillText(`"${LEVELS[stats.level - 1].quote}"`, W / 2, H * 0.3 + 52);
        ctx.globalAlpha = 1;
    }
}

function drawHUD(ctx) {
    // Level
    ctx.fillStyle = '#b2bec3';
    ctx.font = 'bold 12px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LVL ${stats.level}`, 12, 22);

    // Score
    ctx.fillStyle = COLORS.scoreGold;
    ctx.font = 'bold 14px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(stats.score.toLocaleString(), W - 70, 22);

    // HP bar
    const barX = 12;
    const barY = 30;
    const barW = 80;
    const barH = 6;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    const ratio = stats.hp / stats.maxHp;
    const hpColor = ratio > 0.6 ? COLORS.healthGreen : ratio > 0.3 ? COLORS.healthOrange : COLORS.healthRed;
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.fillStyle = '#b2bec3';
    ctx.font = '9px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${stats.hp}/${stats.maxHp}`, barX, barY + 16);

    // Reload indicator
    if (reloadTimer > 0) {
        const rl = reloadTimer / getReloadCooldown();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(W / 2 - 20, H - 55, 40 * (1 - rl), 3);
    }

    // Active interceptors
    ctx.fillStyle = '#636e72';
    ctx.font = '10px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    const activeCount = interceptors.filter(i => i.active).length;
    const maxI = getMaxInterceptors();
    for (let i = 0; i < maxI; i++) {
        ctx.fillStyle = i < maxI - activeCount ? '#74b9ff' : '#2d3436';
        ctx.fillRect(W / 2 - maxI * 6 + i * 12, H - 48, 8, 4);
    }
}

// ─── BOOST CHOICE STATE ──────────────────────
function setupBoostChoice() {
    villain.setExpression('scheming');
    const boostIdx = stats.level - 1; // level just completed, 0-indexed
    if (boostIdx >= BOOSTS.length) {
        // No more boosts, go to next level
        stats.level++;
        changeState('playing');
        return;
    }
    const choices = BOOSTS[boostIdx];

    overlay.innerHTML = `
        <div class="boost-screen">
            <div class="boost-title">Level ${stats.level} Complete!</div>
            <div class="boost-subtitle">Choose your upgrade, Commander</div>
            <div class="boost-cards">
                <div class="boost-card" id="boostLeft">
                    <div class="icon">${choices.left.icon}</div>
                    <div class="name">${choices.left.name}</div>
                    <div class="desc">"${choices.left.desc}"</div>
                    <div class="effect">${choices.left.effect}</div>
                </div>
                <div class="boost-card" id="boostRight">
                    <div class="icon">${choices.right.icon}</div>
                    <div class="name">${choices.right.name}</div>
                    <div class="desc">"${choices.right.desc}"</div>
                    <div class="effect">${choices.right.effect}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('boostLeft').addEventListener('click', () => applyBoost(choices.left));
    document.getElementById('boostRight').addEventListener('click', () => applyBoost(choices.right));
}

function applyBoost(boost) {
    audio.playBoostChosen();

    switch(boost.stat) {
        case 'firepower': stats.firepower += boost.value; break;
        case 'reload': stats.reload += boost.value; break;
        case 'speed': stats.speed += boost.value; break;
        case 'maxInterceptors': stats.maxInterceptors += boost.value; break;
        case 'morale': stats.morale += boost.value; break;
        case 'repair':
            stats.hp = Math.min(stats.maxHp, stats.hp + boost.value);
            baseRenderer.hp = stats.hp;
            break;
        case 'firePlusSpeed':
            stats.firepower += boost.value;
            stats.speed += boost.value;
            break;
        case 'moralePlusRepair':
            stats.morale += 2;
            stats.hp = Math.min(stats.maxHp, stats.hp + 1);
            baseRenderer.hp = stats.hp;
            break;
        case 'repairPlusReload':
            stats.hp = Math.min(stats.maxHp, stats.hp + 2);
            stats.reload += boost.value;
            baseRenderer.hp = stats.hp;
            break;
        case 'allStats':
            stats.firepower += 1;
            stats.reload += 1;
            stats.speed += 1;
            stats.maxInterceptors += 1;
            stats.morale += 1;
            break;
    }

    stats.level++;
    changeState('playing');
}

// ─── GAME OVER STATE ─────────────────────────
function setupGameOver() {
    audio.playGameOver();
    villain.setExpression('laugh');
    particles.celebration(W / 2, H / 2); // Destruction particles

    const F = "font-family:'Segoe UI',Arial,sans-serif;";
    overlay.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,10,26,0.92);z-index:20;animation:fadeIn 0.5s ease;">
            <div style="${F}font-size:32px;font-weight:900;color:#d63031;text-transform:uppercase;letter-spacing:3px;margin-bottom:15px;">BASE DESTROYED</div>
            <div style="${F}font-size:16px;color:#b2bec3;margin-bottom:8px;">Reached Level ${stats.level}</div>
            <div style="${F}font-size:22px;color:#ffeaa7;font-weight:700;margin-bottom:6px;">Score: ${stats.score.toLocaleString()}</div>
            <div id="scoreStatusMsg" style="${F}font-size:13px;color:#636e72;margin-bottom:24px;min-height:20px;">${playerName ? 'Submitting score...' : ''}</div>
            <div style="display:flex;gap:12px;align-items:center;">
                <div id="retryBtn" style="${F}font-size:18px;font-weight:700;color:#1a1a2e;background:#d63031;padding:12px 45px;border-radius:12px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;">TRY AGAIN</div>
                <div id="menuBtn" style="${F}font-size:18px;font-weight:700;color:#1a1a2e;background:#b2bec3;padding:12px 45px;border-radius:12px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;">MAIN SCREEN</div>
            </div>
        </div>
    `;

    document.getElementById('retryBtn').addEventListener('click', () => {
        audio.playSelect();
        changeState('playing');
    });

    document.getElementById('menuBtn').addEventListener('click', () => {
        audio.playSelect();
        changeState('menu');
    });

    // Submit score in background (only if new personal best)
    if (playerName && stats.score > 0) {
        submitScore(playerName, stats.score, stats.level).then(submitted => {
            const msg = document.getElementById('scoreStatusMsg');
            if (!msg) return;
            if (submitted) {
                msg.style.color = '#00b894';
                msg.textContent = '🏆 New Personal Best! Score submitted.';
            } else {
                msg.style.color = '#4b5563';
                msg.textContent = 'Score saved locally.';
            }
        });
    }
}

// ─── VICTORY STATE ───────────────────────────
function setupVictory() {
    audio.playVictory();
    villain.setExpression('defeated');

    // Celebration particles burst
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            particles.celebration(randRange(50, W - 50), randRange(100, H - 200));
        }, i * 400);
    }

    const F = "font-family:'Segoe UI',Arial,sans-serif;";
    overlay.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,10,26,0.92);z-index:20;animation:fadeIn 0.5s ease;">
            <div style="${F}font-size:36px;font-weight:900;color:#ffeaa7;text-transform:uppercase;letter-spacing:4px;text-shadow:0 0 30px rgba(255,234,167,0.5);margin-bottom:8px;">VICTORY!</div>
            <div style="${F}font-size:14px;color:#00b894;margin-bottom:5px;">All 20 levels conquered!</div>
            <div style="${F}font-size:14px;color:#b2bec3;font-style:italic;margin-bottom:15px;">"This... this is impossible!" - The Commander</div>
            <div style="${F}font-size:26px;color:#ffeaa7;font-weight:700;margin-bottom:6px;">Final Score: ${stats.score.toLocaleString()}</div>
            <div id="scoreStatusMsg" style="${F}font-size:13px;color:#636e72;margin-bottom:24px;min-height:20px;">${playerName ? 'Submitting score...' : ''}</div>
            <div style="display:flex;gap:12px;align-items:center;">
                <div id="playAgainBtn" style="${F}font-size:18px;font-weight:700;color:#1a1a2e;background:#00b894;padding:12px 45px;border-radius:12px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;">PLAY AGAIN</div>
                <div id="mainMenuBtn" style="${F}font-size:18px;font-weight:700;color:#1a1a2e;background:#b2bec3;padding:12px 45px;border-radius:12px;cursor:pointer;letter-spacing:2px;text-transform:uppercase;">MAIN SCREEN</div>
            </div>
        </div>
    `;

    document.getElementById('playAgainBtn').addEventListener('click', () => {
        audio.playSelect();
        changeState('playing');
    });

    document.getElementById('mainMenuBtn').addEventListener('click', () => {
        audio.playSelect();
        changeState('menu');
    });

    // Submit score in background (only if new personal best)
    if (playerName && stats.score > 0) {
        submitScore(playerName, stats.score, 20).then(submitted => {
            const msg = document.getElementById('scoreStatusMsg');
            if (!msg) return;
            if (submitted) {
                msg.style.color = '#ffeaa7';
                msg.textContent = '🏆 New All-Time Best! Score submitted!';
            } else {
                msg.style.color = '#4b5563';
                msg.textContent = 'Score saved locally.';
            }
        });
    }
}

// ─── GAME LOOP ───────────────────────────────
const FIXED_DT = 1 / 60;
let lastTime = 0;
let accumulator = 0;

function loop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap dt to avoid spiral of death
    if (dt > 0.1) dt = 0.1;
    accumulator += dt;

    while (accumulator >= FIXED_DT) {
        update(FIXED_DT);
        accumulator -= FIXED_DT;
    }

    render();
    requestAnimationFrame(loop);
}

function update(dt) {
    stateTimer += dt;
    shake.update(dt);
    particles.update(dt);
    villain.update(dt);
    baseRenderer.update(dt);

    if (gameState === 'playing') {
        updatePlaying(dt);
    }
}

function render() {
    ctx.clearRect(0, 0, W, H);

    if (gameState === 'playing') {
        drawPlaying(ctx);
    } else if (gameState === 'menu' || gameState === 'boost' || gameState === 'gameover' || gameState === 'victory') {
        // Draw game behind overlay
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, COLORS.bgTop);
        bgGrad.addColorStop(1, COLORS.bgBottom);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137.5) % W;
            const sy = (i * 73.1) % (H * 0.5);
            const blink = Math.sin(Date.now() / 1000 + i * 0.7) * 0.5 + 0.5;
            ctx.globalAlpha = blink * 0.3;
            ctx.fillRect(sx, sy, 1, 1);
        }
        ctx.globalAlpha = 1;

        baseRenderer.draw(ctx, W, H);
        particles.draw(ctx);

        // Draw villain on game over / victory
        if (gameState === 'gameover' || gameState === 'victory') {
            villain.draw(ctx, W / 2, H * 0.15, 80);
        }
    }
}

// ─── START ───────────────────────────────────
changeState('menu');
requestAnimationFrame(loop);
