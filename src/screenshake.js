export class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.elapsed = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    trigger(intensity, duration) {
        if (intensity > this.intensity) {
            this.intensity = intensity;
            this.duration = duration;
            this.elapsed = 0;
        }
    }

    update(dt) {
        if (this.elapsed < this.duration) {
            this.elapsed += dt;
            const progress = this.elapsed / this.duration;
            const fade = 1 - progress;
            this.offsetX = (Math.random() * 2 - 1) * this.intensity * fade;
            this.offsetY = (Math.random() * 2 - 1) * this.intensity * fade;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
            this.intensity = 0;
        }
    }

    apply(ctx) {
        ctx.translate(this.offsetX, this.offsetY);
    }
}
