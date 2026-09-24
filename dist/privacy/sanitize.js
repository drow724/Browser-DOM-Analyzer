export function normalizeText(value, maxLength = 240) {
    return value.replace(/\s+/gu, ' ').trim().slice(0, maxLength);
}
export function sanitizeText(value, kind, max, options) {
    if (!value)
        return undefined;
    // Defense in depth, not a general PII detector. Redact before truncation.
    let text = value.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
        .replace(/\bBearer\s+\S+/gi, '[token]')
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]');
    text = normalizeText(text, max);
    const redacted = options.redact ? options.redact(text, kind) : text;
    return redacted === undefined ? undefined : normalizeText(redacted, max) || undefined;
}
export function sanitizeURL(value, base, mode = 'origin') {
    if (mode === 'omit')
        return undefined;
    try {
        const url = new URL(value, base);
        if (!['http:', 'https:'].includes(url.protocol))
            return undefined;
        return url.origin + (mode === 'path' ? url.pathname : '');
    }
    catch {
        return undefined;
    }
}
/** Crosses open shadow boundaries and slotted ancestry without reading values. */
export function composedParent(el) {
    if (el.assignedSlot)
        return el.assignedSlot;
    if (el.parentElement)
        return el.parentElement;
    const root = el.getRootNode();
    return 'host' in root ? root.host : null;
}
export function isPrivateSelf(el, options) {
    const tag = el.localName;
    return ['textarea', 'select', 'option'].includes(tag) ||
        el.hasAttribute('data-private') || el.hasAttribute('data-dom-analyzer-ignore') ||
        el.getAttribute('contenteditable')?.toLowerCase() !== 'false' && el.hasAttribute('contenteditable') ||
        Boolean(options.excludeSelectors?.some(selector => el.matches(selector)));
}
export function isPrivateTree(el, options) {
    for (let cursor = el; cursor; cursor = composedParent(cursor)) {
        if (isPrivateSelf(cursor, options))
            return true;
    }
    return el.ownerDocument.designMode === 'on';
}
//# sourceMappingURL=sanitize.js.map