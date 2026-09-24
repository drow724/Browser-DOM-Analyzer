import type { StyleDescriptor, StyleId } from '../model/SiteDOMModel.js';
import { styleKey } from './normalizeStyle.js';
export class StyleRegistry {
  readonly styles: Record<StyleId, StyleDescriptor> = {};
  private readonly keys = new Map<string, StyleId>();
  intern(style: StyleDescriptor): StyleId {
    const key = styleKey(style);
    const existing = this.keys.get(key);
    if (existing) return existing;
    const id = `s${this.keys.size + 1}`;
    this.keys.set(key, id);
    this.styles[id] = { ...style };
    return id;
  }
}
