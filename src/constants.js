// Game dimensions (logical, scaled to fit screen)
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 720;

// Colors
export const COLORS = {
    bgTop: '#1a1a2e',
    bgBottom: '#16213e',
    ground: '#2d3436',
    base: '#636e72',
    baseHighlight: '#b2bec3',
    launcher: '#2d3436',
    launcherTip: '#d63031',
    interceptor: '#ffffff',
    interceptorTrail: '#74b9ff',
    enemyBody: '#e17055',
    enemyTrail: '#d63031',
    explosionInner: '#fdcb6e',
    explosionMid: '#e17055',
    explosionOuter: '#d63031',
    particleYellow: '#ffeaa7',
    particlePink: '#fab1a0',
    particleWhite: '#ffffff',
    particleRed: '#ff7675',
    uiText: '#dfe6e9',
    scoreGold: '#ffeaa7',
    healthGreen: '#00b894',
    healthOrange: '#e17055',
    healthRed: '#d63031',
    villainSkin: '#ffeaa7',
    villainFeature: '#2d3436',
};

// Gameplay defaults
export const BASE_INTERCEPTOR_SPEED = 550;
export const BASE_RELOAD_COOLDOWN = 0.35;
export const BASE_EXPLOSION_RADIUS = 38;
export const BASE_MAX_INTERCEPTORS = 3;
export const BASE_HP = 8;

// Scoring
export const SCORE = {
    standard: 100,
    fast: 150,
    zigzag: 200,
    cluster: 300,
    heavy: 400,
    decoy: 50,
    mirv: 1000,
    mirvWarhead: 200,
    chainBonus: 1.5,
    perfectWave: 2.0,
    noDamageBonus: 500,
};
