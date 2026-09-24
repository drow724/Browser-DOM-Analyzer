export type TextKind = 'text' | 'name' | 'title' | 'alt' | 'identity';
export interface PrivacyOptions {
    /** Additional application-specific redaction, after built-in normalization. Return undefined to omit. */
    redact?: (text: string, kind: TextKind) => string | undefined;
    /** Explicitly opted in because identifiers/classes can contain user/account data. */
    includeIdentity?: boolean;
    urlMode?: 'origin' | 'path' | 'omit';
    excludeSelectors?: string[];
}
export declare function normalizeText(value: string, maxLength?: number): string;
export declare function sanitizeText(value: string | null, kind: TextKind, max: number, options: PrivacyOptions): string | undefined;
export declare function sanitizeURL(value: string, base: string, mode?: PrivacyOptions['urlMode']): string | undefined;
/** Crosses open shadow boundaries and slotted ancestry without reading values. */
export declare function composedParent(el: Element): Element | null;
export declare function isPrivateSelf(el: Element, options: PrivacyOptions): boolean;
export declare function isPrivateTree(el: Element, options: PrivacyOptions): boolean;
