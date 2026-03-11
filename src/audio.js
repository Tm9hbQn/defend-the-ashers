export class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { /* no audio support */ }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    _noise(duration) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr * duration, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        return buf;
    }

    playLaunch() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        // Noise burst
        const nSrc = this.ctx.createBufferSource();
        nSrc.buffer = this._noise(0.15);
        const nGain = this.ctx.createGain();
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'bandpass'; nFilter.frequency.value = 900; nFilter.Q.value = 2;
        nGain.gain.setValueAtTime(0.15, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        nSrc.connect(nFilter).connect(nGain).connect(this.ctx.destination);
        nSrc.start(t); nSrc.stop(t + 0.15);
        // Sweep
        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        oGain.gain.setValueAtTime(0.08, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(oGain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.15);
    }

    playExplosion(big = false) {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const dur = big ? 0.35 : 0.2;
        // Noise
        const nSrc = this.ctx.createBufferSource();
        nSrc.buffer = this._noise(dur);
        const nGain = this.ctx.createGain();
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'lowpass';
        nFilter.frequency.setValueAtTime(big ? 800 : 1200, t);
        nFilter.frequency.exponentialRampToValueAtTime(200, t + dur);
        nGain.gain.setValueAtTime(big ? 0.25 : 0.15, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        nSrc.connect(nFilter).connect(nGain).connect(this.ctx.destination);
        nSrc.start(t); nSrc.stop(t + dur);
        // Sub bass
        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = big ? 40 : 60;
        oGain.gain.setValueAtTime(big ? 0.3 : 0.15, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
        osc.connect(oGain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + dur);
    }

    playBaseHit() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.value = 80;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.35);
        // Clang
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o2.type = 'triangle'; o2.frequency.value = 2000;
        g2.gain.setValueAtTime(0.1, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o2.connect(g2).connect(this.ctx.destination);
        o2.start(t); o2.stop(t + 0.08);
    }

    playSelect() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.1);
    }

    playBoostChosen() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2);
        });
    }

    playBossWarning() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, t + i * 0.4);
            osc.frequency.linearRampToValueAtTime(150, t + i * 0.4 + 0.2);
            gain.gain.setValueAtTime(0.1, t + i * 0.4);
            gain.gain.setValueAtTime(0, t + i * 0.4 + 0.2);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(t + i * 0.4); osc.stop(t + i * 0.4 + 0.25);
        }
    }

    playVictory() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.6);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(t + i * 0.12); osc.stop(t + 1.5);
        });
    }

    playGameOver() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 1.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 600;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.connect(filter).connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 1.6);
    }
}
