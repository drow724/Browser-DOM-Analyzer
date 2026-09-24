export function readRect(el) {
    const r = el.getBoundingClientRect();
    const round = (n) => Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
    return { x: round(r.x), y: round(r.y), width: round(r.width), height: round(r.height) };
}
export function intersectsViewport(r, v) {
    return r.width > 0 && r.height > 0 && r.x < v.width && r.y < v.height && r.x + r.width > 0 && r.y + r.height > 0;
}
//# sourceMappingURL=geometry.js.map