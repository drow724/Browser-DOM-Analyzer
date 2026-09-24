export type TextKind = 'text' | 'name' | 'title' | 'alt' | 'identity';
export interface PrivacyOptions {
  /** Additional application-specific redaction, after built-in normalization. Return undefined to omit. */
  redact?: (text: string, kind: TextKind) => string | undefined;
  /** Explicitly opted in because identifiers/classes can contain user/account data. */
  includeIdentity?: boolean;
  urlMode?: 'origin' | 'path' | 'omit';
  excludeSelectors?: string[];
}
export function normalizeText(value: string, maxLength = 240): string {
  return value.replace(/\s+/gu, ' ').trim().slice(0, maxLength);
}
export function sanitizeText(value: string | null, kind: TextKind, max: number, options: PrivacyOptions): string | undefined {
  if (!value) return undefined;
  // Defense in depth, not a general PII detector. Redact before truncation.
  let text = value.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\bBearer\s+\S+/gi, '[token]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]');
  text = normalizeText(text, max);
  const redacted = options.redact ? options.redact(text, kind) : text;
  return redacted === undefined ? undefined : normalizeText(redacted, max) || undefined;
}
export function sanitizeURL(value: string, base: string, mode: PrivacyOptions['urlMode'] = 'origin'): string | undefined {
  if (mode === 'omit') return undefined;
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return url.origin + (mode === 'path' ? url.pathname : '');
  } catch { return undefined; }
}
/** Crosses open shadow boundaries and slotted ancestry without reading values. */
export function composedParent(el: Element): Element | null {
  if (el.assignedSlot) return el.assignedSlot;
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode();
  return 'host' in root ? (root as ShadowRoot).host : null;
}
export function isPrivateSelf(el: Element, options: PrivacyOptions): boolean {
  const tag = el.localName;
  return ['textarea', 'select', 'option'].includes(tag) ||
    el.hasAttribute('data-private') || el.hasAttribute('data-dom-analyzer-ignore') ||
    el.getAttribute('contenteditable')?.toLowerCase() !== 'false' && el.hasAttribute('contenteditable') ||
    Boolean(options.excludeSelectors?.some(selector => el.matches(selector)));
}
export function isPrivateTree(el: Element, options: PrivacyOptions): boolean {
  for (let cursor: Element | null = el; cursor; cursor = composedParent(cursor)) {
    if (isPrivateSelf(cursor, options)) return true;
  }
  return el.ownerDocument.designMode === 'on';
}
