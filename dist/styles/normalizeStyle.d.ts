import type { StyleDescriptor } from '../model/SiteDOMModel.js';
export declare const STYLE_PROPERTIES: readonly ["display", "position", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "color", "background-color", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom", "margin-left", "row-gap", "column-gap", ...string[], "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius", "box-shadow", "cursor", "z-index", "align-items", "justify-content", "flex-direction", "opacity"];
export declare function normalizeStyle(style: CSSStyleDeclaration): StyleDescriptor;
/** Exact key-sorted serialization, no lossy hashing and therefore no hash collisions. */
export declare function styleKey(style: StyleDescriptor): string;
