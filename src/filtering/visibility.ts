import type { Rect } from '../model/SiteDOMModel.js';
/** Not occlusion/hit-test visibility. visibility:hidden can be overridden by descendants. */
export function visibility(style: CSSStyleDeclaration, rect: Rect): { visible: boolean; blockSubtree: boolean } {
  const clippedHelper = rect.width <= 1 && rect.height <= 1 &&
    (style.clip !== 'auto' || style.clipPath !== 'none' || style.overflow === 'hidden');
  const blockSubtree = style.display === 'none' || Number(style.opacity) === 0 || clippedHelper;
  return { blockSubtree, visible: !blockSubtree && !['hidden', 'collapse'].includes(style.visibility) &&
    rect.width > 0 && rect.height > 0 && !clippedHelper };
}
