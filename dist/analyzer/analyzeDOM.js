import { traverseDOM } from '../traversal/traverseDOM.js';
import { defaultFilter, blockedTags } from '../filtering/noiseFilter.js';
import { visibility } from '../filtering/visibility.js';
import { detectInteraction } from '../features/interaction.js';
import { extractSemantic, ownsText } from '../features/semantic.js';
import { readRect, intersectsViewport } from '../features/geometry.js';
import { normalizeStyle } from '../styles/normalizeStyle.js';
import { StyleRegistry } from '../styles/styleRegistry.js';
import { isPrivateSelf, sanitizeText, sanitizeURL } from '../privacy/sanitize.js';
/** Synchronous read-only snapshot of a live Document. No observers, listeners, network, storage or DOM writes. */
export function analyzeDOM(document, options = {}) {
    const win = document.defaultView;
    if (!win || !document.documentElement)
        throw new TypeError('analyzeDOM requires a live browser Document');
    const maxText = options.maxTextLength ?? 240;
    const maxElements = options.maxElements ?? 100_000;
    if (!Number.isInteger(maxText) || maxText < 0 || maxText > 10_000)
        throw new RangeError('maxTextLength must be an integer in [0, 10000]');
    if (!Number.isInteger(maxElements) || maxElements < 1)
        throw new RangeError('maxElements must be a positive integer');
    const privacy = options.privacy ?? {};
    // Fail early for invalid caller selectors. No partial traversal silently accepted.
    for (const selector of privacy.excludeSelectors ?? [])
        document.documentElement.matches(selector);
    const start = win.performance.now();
    const viewport = { width: win.innerWidth, height: win.innerHeight, scrollX: win.scrollX, scrollY: win.scrollY, devicePixelRatio: win.devicePixelRatio };
    const registry = new StyleRegistry();
    const model = {
        version: '0.1.0', url: sanitizeURL(document.URL, document.URL, privacy.urlMode) ?? '', viewport,
        coordinateSpace: 'viewport-css-px', rootId: 'n1', nodes: {}, scopes: { document: { kind: 'document' } },
        stats: { scannedElements: 0, includedElements: 0, ignoredElements: 0, uniqueStyles: 0, scanDurationMs: 0 },
        coverage: { tree: 'composed-open-shadow', iframes: 'boundary-only', truncated: false },
    };
    const states = new WeakMap();
    const filter = options.filter ?? defaultFilter;
    for (const { element: el, parent, scopeHost } of traverseDOM(document.documentElement)) {
        if (model.stats.scannedElements >= maxElements) {
            model.coverage.truncated = true;
            break;
        }
        const index = ++model.stats.scannedElements;
        const isRoot = el === document.documentElement;
        const inherited = parent ? states.get(parent) : undefined;
        const hostState = scopeHost ? states.get(scopeHost) : undefined;
        const scopeId = scopeHost && hostState?.parentId ? `shadow:${hostState.parentId}` : 'document';
        const state = { parentId: inherited?.parentId, blocked: inherited?.blocked ?? false,
            textOwned: inherited?.textOwned ?? false, inert: inherited?.inert ?? false,
            ariaHidden: inherited?.ariaHidden ?? false, scopeId };
        states.set(el, state);
        if (state.blocked && !isRoot)
            continue;
        const markerExcluded = el.hasAttribute('data-private') || el.hasAttribute('data-dom-analyzer-ignore') || privacy.excludeSelectors?.some(s => el.matches(s));
        if ((markerExcluded || blockedTags.has(el.localName)) && !isRoot) {
            state.blocked = true;
            continue;
        }
        const style = win.getComputedStyle(el);
        const rect = readRect(el);
        const visible = visibility(style, rect);
        if (visible.blockSubtree && !isRoot) {
            state.blocked = true;
            continue;
        }
        // Closed <details> descendants are not rendered except its first direct summary.
        if (parent?.localName === 'details' && !parent.hasAttribute('open') &&
            el !== Array.from(parent.children).find(child => child.localName === 'summary')) {
            state.blocked = true;
            continue;
        }
        state.inert ||= el.hasAttribute('inert');
        state.ariaHidden ||= el.getAttribute('aria-hidden') === 'true';
        state.blocked = Boolean(markerExcluded) || visible.blockSubtree || isPrivateSelf(el, privacy) || document.designMode === 'on' ||
            el.localName === 'svg' || el.localName === 'iframe' || style.contentVisibility === 'hidden';
        const meaningfulBoxless = style.display === 'contents' && style.visibility === 'visible';
        if (!isRoot && !visible.visible && !meaningfulBoxless && !el.shadowRoot && el.localName !== 'slot')
            continue;
        const interaction = detectInteraction(el, style, state.inert);
        const ownTextOwner = ownsText(el);
        const semantic = markerExcluded || document.designMode === 'on' ? {} : extractSemantic(el, privacy, maxText, style.contentVisibility === 'hidden' || state.textOwned && !ownTextOwner);
        if (state.ariaHidden)
            semantic.ariaHidden = true;
        if (el.localName === 'a' && el.hasAttribute('href')) {
            const href = sanitizeURL(el.getAttribute('href'), document.baseURI, privacy.urlMode);
            if (href)
                interaction.href = href;
        }
        const decision = filter({ element: el, style, visible: visible.visible, semantic, interaction, hasOwnText: Boolean(semantic.text) });
        if (decision === 'exclude-subtree' && !isRoot) {
            state.blocked = true;
            continue;
        }
        if (decision === 'collapse' && !isRoot && !el.shadowRoot && el.localName !== 'slot')
            continue;
        const id = `n${index}`;
        const node = { id, identity: { tag: el.localName }, semantic, interaction,
            layout: { visible: visible.visible, inViewport: visible.visible && intersectsViewport(rect, viewport), rect, position: style.position },
            structure: { ...(state.parentId ? { parentId: state.parentId } : {}), childrenIds: [], scopeId },
        };
        if (privacy.includeIdentity && !isPrivateSelf(el, privacy)) {
            const domId = sanitizeText(el.id, 'identity', 128, privacy);
            if (domId)
                node.identity.id = domId;
            const classes = Array.from(el.classList).sort().slice(0, 16).map(c => sanitizeText(c, 'identity', 80, privacy)).filter((c) => Boolean(c));
            if (classes.length)
                node.identity.classes = classes;
        }
        const z = Number(style.zIndex);
        if (style.zIndex !== 'auto' && Number.isFinite(z))
            node.layout.zIndex = z;
        if (options.styles !== false)
            node.design = { styleRef: registry.intern(normalizeStyle(style)) };
        if (el.shadowRoot) {
            node.boundary = { shadow: 'open' };
            model.scopes[`shadow:${id}`] = { kind: 'shadow', hostId: id, parentScopeId: scopeId };
        }
        if (el.localName === 'iframe')
            node.boundary = { iframe: 'not-traversed' };
        model.nodes[id] = node;
        if (state.parentId)
            model.nodes[state.parentId].structure.childrenIds.push(id);
        state.parentId = id;
        state.textOwned ||= ownTextOwner && Boolean(semantic.text);
    }
    model.stats.includedElements = Object.keys(model.nodes).length;
    model.stats.ignoredElements = model.stats.scannedElements - model.stats.includedElements;
    model.stats.uniqueStyles = Object.keys(registry.styles).length;
    model.stats.scanDurationMs = Math.round((win.performance.now() - start) * 100) / 100;
    if (options.styles !== false)
        model.styles = registry.styles;
    return model;
}
//# sourceMappingURL=analyzeDOM.js.map