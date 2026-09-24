import type { Rect } from '../model/SiteDOMModel.js';
/** Not occlusion/hit-test visibility. visibility:hidden can be overridden by descendants. */
export declare function visibility(style: CSSStyleDeclaration, rect: Rect): {
    visible: boolean;
    blockSubtree: boolean;
};
