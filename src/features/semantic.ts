import type { SiteNode } from '../model/SiteDOMModel.js';
import { composedParent, isPrivateTree, sanitizeText, type PrivacyOptions } from '../privacy/sanitize.js';
import { composedChildren } from '../traversal/traverseDOM.js';
import { blockedTags } from '../filtering/noiseFilter.js';
const implicitRoles: Record<string, string> = {
  button: 'button', main: 'main', nav: 'navigation', aside: 'complementary',
  article: 'article', ul: 'list', ol: 'list', li: 'listitem', table: 'table',
  tr: 'row', th: 'columnheader', td: 'cell', textarea: 'textbox', select: 'combobox',
  img: 'img', summary: 'button', progress: 'progressbar', dialog: 'dialog',
};
export function roleOf(el: Element): Pick<SiteNode['semantic'], 'role' | 'roleSource'> {
  const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0];
  if (explicit) return { role: explicit.slice(0, 64), roleSource: 'explicit' };
  const tag = el.localName;
  let role = implicitRoles[tag];
  if (/^h[1-6]$/.test(tag)) role = 'heading';
  if (tag === 'a' && el.hasAttribute('href')) role = 'link';
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type;
    role = ({ checkbox: 'checkbox', radio: 'radio', range: 'slider', number: 'spinbutton', search: 'searchbox', button: 'button', submit: 'button', reset: 'button' } as Record<string, string>)[type];
    if (!role && !['hidden', 'password', 'color', 'file', 'image'].includes(type)) role = 'textbox';
  }
  return role ? { role, roleSource: 'implicit' } : {};
}
export function ownsText(el: Element): boolean {
  return /^(h[1-6]|button|a|label|summary)$/.test(el.localName) || ['button', 'link', 'heading'].includes(el.getAttribute('role') || '');
}
/** Bounded, value-free text walk. Explicit references may read hidden label text, never state/script/editable text. */
export function readSafeText(el: Element, options: PrivacyOptions, max: number, allowHidden = false): string {
  if (isPrivateTree(el, options)) return '';
  for (let ancestor: Element | null = el; ancestor; ancestor = composedParent(ancestor)) {
    if (blockedTags.has(ancestor.localName)) return '';
  }
  const stack: Node[] = [el];
  let text = '', visits = 0;
  while (stack.length && text.length < max * 4 && visits++ < 2048) {
    const node = stack.pop()!;
    if (node.nodeType === 3) { text += node.nodeValue || ''; continue; }
    if (node.nodeType !== 1) continue;
    const current = node as Element;
    if (blockedTags.has(current.localName) || ['input', 'textarea', 'select', 'option'].includes(current.localName) || isPrivateTree(current, options)) continue;
    if (current !== el && /^(button|a|summary)$/.test(current.localName)) continue;
    if (!allowHidden) {
      const style = current.ownerDocument.defaultView!.getComputedStyle(current);
      if (style.display === 'none' || Number(style.opacity) === 0 || current.getAttribute('aria-hidden') === 'true') continue;
      if (['hidden', 'collapse'].includes(style.visibility)) {
        // Descendants can explicitly restore visibility; do not include this element's own text.
        const children = composedChildren(current);
        for (let i = children.length - 1; i >= 0; i--) if (children[i]!.nodeType === 1) stack.push(children[i]!);
        continue;
      }
      if (style.contentVisibility === 'hidden') continue;
    }
    const children = composedChildren(current);
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]!);
  }
  return text;
}
export function extractSemantic(el: Element, options: PrivacyOptions, max: number, suppressText = false): SiteNode['semantic'] {
  const result: SiteNode['semantic'] = roleOf(el);
  if (el.getAttribute('aria-hidden') === 'true') result.ariaHidden = true;
  // Control annotations (labels/ARIA) are useful; editable text and all descendant state remain excluded.
  const privateTree = isPrivateTree(el, options);
  const clean = (text: string | null, kind: 'name' | 'text' | 'alt' | 'title') => sanitizeText(text, kind, max, options);
  if (!privateTree && !suppressText) {
    const raw = ownsText(el) ? readSafeText(el, options, max) :
      composedChildren(el).filter(n => n.nodeType === 3).map(n => n.nodeValue || '').join(' ');
    result.text = clean(raw, 'text');
  }
  result.title = clean(el.getAttribute('title'), 'title');
  result.alt = clean(el.getAttribute('alt'), 'alt');
  const root = el.getRootNode() as Document | ShadowRoot;
  const references = (el.getAttribute('aria-labelledby') || '').trim().split(/\s+/).filter(Boolean).slice(0, 16);
  const labelled = references.map(id => root.getElementById?.(id)).filter((x): x is HTMLElement => Boolean(x))
    .map(target => readSafeText(target, options, max, true)).join(' ');
  const labels = 'labels' in el ? Array.from((el as HTMLInputElement).labels || []).slice(0, 16)
    .map(label => readSafeText(label, options, max, true)).join(' ') : '';
  const candidates: [SiteNode['semantic']['nameSource'], string | null | undefined][] = [
    ['aria-labelledby', labelled], ['aria-label', el.getAttribute('aria-label')], ['label', labels],
    ['alt', result.alt], ['text', ownsText(el) ? result.text : undefined], ['title', result.title],
  ];
  for (const [source, raw] of candidates) {
    const name = clean(raw || '', 'name');
    if (name) { result.name = name; result.nameSource = source; break; }
  }
  for (const key of Object.keys(result) as (keyof typeof result)[]) if (result[key] === undefined) delete result[key];
  return result;
}
