import type { StyleDescriptor, StyleId } from '../model/SiteDOMModel.js';
export declare class StyleRegistry {
    readonly styles: Record<StyleId, StyleDescriptor>;
    private readonly keys;
    intern(style: StyleDescriptor): StyleId;
}
