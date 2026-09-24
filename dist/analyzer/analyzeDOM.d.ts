import type { SiteDOMModel } from '../model/SiteDOMModel.js';
import { type FilterPolicy } from '../filtering/noiseFilter.js';
import { type PrivacyOptions } from '../privacy/sanitize.js';
export interface AnalyzeOptions {
    styles?: boolean;
    maxTextLength?: number;
    /** Deterministic element budget, not a time budget. Partial output is explicitly marked. */
    maxElements?: number;
    privacy?: PrivacyOptions;
    filter?: FilterPolicy;
}
/** Synchronous read-only snapshot of a live Document. No observers, listeners, network, storage or DOM writes. */
export declare function analyzeDOM(document: Document, options?: AnalyzeOptions): SiteDOMModel;
