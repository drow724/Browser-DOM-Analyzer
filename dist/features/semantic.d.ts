import type { SiteNode } from '../model/SiteDOMModel.js';
import { type PrivacyOptions } from '../privacy/sanitize.js';
export declare function roleOf(el: Element): Pick<SiteNode['semantic'], 'role' | 'roleSource'>;
export declare function ownsText(el: Element): boolean;
/** Bounded, value-free text walk. Explicit references may read hidden label text, never state/script/editable text. */
export declare function readSafeText(el: Element, options: PrivacyOptions, max: number, allowHidden?: boolean): string;
export declare function extractSemantic(el: Element, options: PrivacyOptions, max: number, suppressText?: boolean): SiteNode['semantic'];
