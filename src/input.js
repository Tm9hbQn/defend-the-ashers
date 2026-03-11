import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.taps = []; // consumed each frame
        this.onTap = null;

        // Unified pointer events
        canvas.addEventListener('pointerdown', (e) => this._handle(e));
        canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    _handle(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Map client coords to logical game coords (GAME_WIDTH x GAME_HEIGHT)
        const x = ((e.clientX - rect.left) / rect.width) * GAME_WIDTH;
        const y = ((e.clientY - rect.top) / rect.height) * GAME_HEIGHT;
        this.taps.push({ x, y });
        if (this.onTap) this.onTap(x, y);
    }

    consumeTaps() {
        const t = this.taps;
        this.taps = [];
        return t;
    }
}
