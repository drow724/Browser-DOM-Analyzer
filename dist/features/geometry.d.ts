import type { Rect, ViewportInfo } from '../model/SiteDOMModel.js';
export declare function readRect(el: Element): Rect;
export declare function intersectsViewport(r: Rect, v: ViewportInfo): boolean;
