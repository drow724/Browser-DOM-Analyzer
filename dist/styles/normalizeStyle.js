export const STYLE_PROPERTIES = [
    'display', 'position', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'color', 'background-color', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'row-gap', 'column-gap',
    ...['top', 'right', 'bottom', 'left'].flatMap(side => [`border-${side}-width`, `border-${side}-style`, `border-${side}-color`]),
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
    'box-shadow', 'cursor', 'z-index', 'align-items', 'justify-content', 'flex-direction', 'opacity',
];
export function normalizeStyle(style) {
    const result = {};
    for (const key of STYLE_PROPERTIES) {
        const value = style.getPropertyValue(key).trim();
        if (value && !/url\s*\(/i.test(value))
            result[key] = value;
    }
    return result;
}
/** Exact key-sorted serialization, no lossy hashing and therefore no hash collisions. */
export function styleKey(style) {
    return JSON.stringify(Object.keys(style).sort().map(key => [key, style[key]]));
}
//# sourceMappingURL=normalizeStyle.js.map