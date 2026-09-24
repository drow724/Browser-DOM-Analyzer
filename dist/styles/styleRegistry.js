import { styleKey } from './normalizeStyle.js';
export class StyleRegistry {
    styles = {};
    keys = new Map();
    intern(style) {
        const key = styleKey(style);
        const existing = this.keys.get(key);
        if (existing)
            return existing;
        const id = `s${this.keys.size + 1}`;
        this.keys.set(key, id);
        this.styles[id] = { ...style };
        return id;
    }
}
//# sourceMappingURL=styleRegistry.js.map