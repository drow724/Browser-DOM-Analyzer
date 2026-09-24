/** Rendered/composed children: open shadow replaces light DOM; slots distribute assigned nodes once. */
export function composedChildren(el) {
    if (el.shadowRoot)
        return Array.from(el.shadowRoot.childNodes);
    if (el.localName === 'slot' && 'assignedNodes' in el) {
        const assigned = el.assignedNodes();
        if (assigned.length)
            return assigned;
    }
    return Array.from(el.childNodes);
}
/** Iterative preorder; does not recurse on JS stack or mutate DOM. */
export function* traverseDOM(root) {
    const stack = [{ element: root }];
    const seen = new WeakSet();
    while (stack.length) {
        const entry = stack.pop();
        if (seen.has(entry.element))
            continue;
        seen.add(entry.element);
        yield entry;
        const el = entry.element;
        const scopeHost = el.shadowRoot ? el : entry.scopeHost;
        const children = composedChildren(el);
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child.nodeType === 1)
                stack.push({ element: child, parent: el, scopeHost });
        }
    }
}
//# sourceMappingURL=traverseDOM.js.map