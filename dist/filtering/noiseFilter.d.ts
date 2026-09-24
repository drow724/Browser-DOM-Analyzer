import type { SiteNode } from '../model/SiteDOMModel.js';
export declare const blockedTags: Set<string>;
export interface FilterContext {
    element: Element;
    style: CSSStyleDeclaration;
    visible: boolean;
    semantic: SiteNode['semantic'];
    interaction: SiteNode['interaction'];
    hasOwnText: boolean;
}
export type FilterDecision = 'include' | 'collapse' | 'exclude-subtree';
export type FilterPolicy = (context: FilterContext) => FilterDecision;
/** Only anonymous visually plain div/span wrappers collapse. No framework/class-name blacklist. */
export declare const defaultFilter: FilterPolicy;
