const roles = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'textbox', 'combobox', 'searchbox', 'slider', 'spinbutton', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'treeitem']);
export function detectInteraction(el, style, inheritedInert = false) {
    const tag = el.localName;
    const role = (el.getAttribute('role') || '').split(/\s+/)[0] || '';
    const editable = Boolean(el.isContentEditable) || ['input', 'textarea', 'select'].includes(tag);
    const native = ['button', 'input', 'select', 'textarea', 'summary'].includes(tag) || tag === 'a' && el.hasAttribute('href');
    const tabIndex = el.tabIndex;
    const tabindexHint = el.hasAttribute('tabindex') && Number.isFinite(tabIndex);
    const handler = el.hasAttribute('onclick') || typeof el.onclick === 'function';
    const pointer = style?.cursor === 'pointer';
    const evidence = [native && 'native', roles.has(role) && 'role', editable && 'editable', tabindexHint && 'tabindex', handler && 'onclick', pointer && 'cursor'].filter(Boolean);
    const disabled = el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true';
    const inert = inheritedInert || el.hasAttribute('inert');
    const interactive = evidence.length > 0;
    return { interactive, clickable: Boolean(native || roles.has(role) || handler || pointer) && !disabled && !inert,
        editable, disabled, inert, focusable: Number.isFinite(tabIndex) && tabIndex >= 0 && !disabled && !inert,
        ...(tag === 'input' ? { inputType: el.type } : {}), evidence };
}
//# sourceMappingURL=interaction.js.map