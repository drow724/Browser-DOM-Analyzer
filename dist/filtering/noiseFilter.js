export const blockedTags = new Set(['head', 'script', 'style', 'noscript', 'template']);
/** Only anonymous visually plain div/span wrappers collapse. No framework/class-name blacklist. */
export const defaultFilter = ({ element: el, style: s, visible, semantic, interaction, hasOwnText }) => {
    if (!visible && !interaction.interactive && !semantic.role && !el.shadowRoot && el.localName !== 'slot')
        return 'collapse';
    if (!['div', 'span'].includes(el.localName))
        return 'include';
    if (interaction.interactive || semantic.role || semantic.name || hasOwnText || el.shadowRoot)
        return 'include';
    const decorated = !['rgba(0, 0, 0, 0)', 'transparent'].includes(s.backgroundColor) ||
        s.backgroundImage !== 'none' || s.boxShadow !== 'none' || s.transform !== 'none' ||
        ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(s.display) || s.position !== 'static' ||
        ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(s.getPropertyValue('border-' + side.toLowerCase() + '-width')) > 0 ||
            parseFloat(s.getPropertyValue('padding-' + side.toLowerCase())) !== 0 ||
            parseFloat(s.getPropertyValue('margin-' + side.toLowerCase())) !== 0);
    return decorated ? 'include' : 'collapse';
};
//# sourceMappingURL=noiseFilter.js.map