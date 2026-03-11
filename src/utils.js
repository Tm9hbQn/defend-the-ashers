export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }
export function angle(x1, y1, x2, y2) { return Math.atan2(y2-y1, x2-x1); }
export function randRange(min, max) { return min + Math.random() * (max - min); }
export function randInt(min, max) { return Math.floor(randRange(min, max + 1)); }
export function randColor(colors) { return colors[Math.floor(Math.random() * colors.length)]; }
export function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
export function easeInOutQuad(t) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
export function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10*t) * Math.sin((t*10-0.75)*(2*Math.PI)/3) + 1;
}
export function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return { r, g, b };
}
export function rgbaStr(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
}
