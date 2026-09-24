import type { SiteNode } from '../model/SiteDOMModel.js';
export const blockedTags = new Set(['head', 'script', 'style', 'noscript', 'template']);
export interface FilterContext {
  element: Element; style: CSSStyleDeclaration; visible: boolean;
  semantic: SiteNode['semantic']; interaction: SiteNode['interaction']; hasOwnText: boolean;
}
export type FilterDecision = 'include' | 'collapse' | 'exclude-subtree';
export type FilterPolicy = (context: FilterContext) => FilterDecision;
const nonDefaultDimension = (value: string, defaults: string[]) => Boolean(value) && !defaults.includes(value);

export function hasLayoutSignal(s: CSSStyleDeclaration): boolean {
  return ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(s.display) ||
    s.position !== 'static' || s.transform !== 'none' ||
    nonDefaultDimension(s.minWidth, ['0px', 'auto']) ||
    nonDefaultDimension(s.maxWidth, ['none']) ||
    nonDefaultDimension(s.minHeight, ['0px', 'auto']) ||
    nonDefaultDimension(s.maxHeight, ['none']) ||
    !['visible', 'clip'].includes(s.overflowX) ||
    !['visible', 'clip'].includes(s.overflowY) ||
    s.contain !== 'none' || s.aspectRatio !== 'auto';
}

/** Only anonymous visually plain div/span wrappers collapse. No framework/class-name blacklist. */
export const defaultFilter: FilterPolicy = ({ element: el, style: s, visible, semantic, interaction, hasOwnText }) => {
  if (!visible && !interaction.interactive && !semantic.role && !el.shadowRoot && el.localName !== 'slot') return 'collapse';
  if (!['div', 'span'].includes(el.localName)) return 'include';
  if (interaction.interactive || semantic.role || semantic.name || hasOwnText || el.shadowRoot) return 'include';
  const decorated = !['rgba(0, 0, 0, 0)', 'transparent'].includes(s.backgroundColor) ||
    s.backgroundImage !== 'none' || s.boxShadow !== 'none' || hasLayoutSignal(s) ||
    ['Top', 'Right', 'Bottom', 'Left'].some(side =>
      parseFloat(s.getPropertyValue('border-' + side.toLowerCase() + '-width')) > 0 ||
      parseFloat(s.getPropertyValue('padding-' + side.toLowerCase())) !== 0 ||
      parseFloat(s.getPropertyValue('margin-' + side.toLowerCase())) !== 0);
  return decorated ? 'include' : 'collapse';
};
