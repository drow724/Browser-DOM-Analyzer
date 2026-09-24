import type { StyleDescriptor } from '../model/SiteDOMModel.js';
export const STYLE_PROPERTIES = [
  'display', 'position', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'color', 'background-color', 'background-image', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'row-gap', 'column-gap',
  ...['top', 'right', 'bottom', 'left'].flatMap(side => [`border-${side}-width`, `border-${side}-style`, `border-${side}-color`]),
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'box-shadow', 'cursor', 'z-index', 'align-items', 'justify-content', 'flex-direction', 'opacity',
  'transform', 'transform-origin', 'min-width', 'max-width', 'min-height', 'max-height',
  'overflow-x', 'overflow-y', 'contain', 'aspect-ratio',
] as const;
export function normalizeStyle(style: CSSStyleDeclaration): StyleDescriptor {
  const result: StyleDescriptor = {};
  for (const key of STYLE_PROPERTIES) {
    const value = style.getPropertyValue(key).trim();
    if (value && !/url\s*\(/i.test(value)) result[key] = value;
  }
  return result;
}
/** Exact key-sorted serialization, no lossy hashing and therefore no hash collisions. */
export function styleKey(style: StyleDescriptor): string {
  return JSON.stringify(Object.keys(style).sort().map(key => [key, style[key]]));
}
