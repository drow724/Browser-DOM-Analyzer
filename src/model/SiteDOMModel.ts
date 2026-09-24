export type NodeId = string;
export type StyleId = string;
export interface Rect { x: number; y: number; width: number; height: number }
export interface ViewportInfo {
  width: number; height: number; scrollX: number; scrollY: number; devicePixelRatio: number;
}
/** Computed, allowlisted CSS strings, in browser canonical units. No URLs/content/custom properties. */
export type StyleDescriptor = Record<string, string>;
export interface SiteNode {
  id: NodeId;
  identity: { tag: string; id?: string; classes?: string[] };
  semantic: {
    role?: string; roleSource?: 'explicit' | 'implicit';
    name?: string; nameSource?: 'aria-labelledby' | 'aria-label' | 'label' | 'alt' | 'text' | 'title';
    text?: string; title?: string; alt?: string; ariaHidden?: boolean;
  };
  interaction: {
    interactive: boolean; clickable: boolean; editable: boolean; focusable: boolean;
    disabled: boolean; inert: boolean; inputType?: string; href?: string;
    evidence: string[];
  };
  layout: { visible: boolean; inViewport: boolean; rect: Rect; position: string; zIndex?: number };
  design?: { styleRef: StyleId };
  structure: { parentId?: NodeId; childrenIds: NodeId[]; scopeId: string };
  boundary?: { shadow?: 'open'; iframe?: 'not-traversed' };
}
export interface SiteDOMModel {
  version: '0.1.0';
  /** Origin only by default; query/hash/credentials never included. */
  url: string;
  viewport: ViewportInfo;
  coordinateSpace: 'viewport-css-px';
  rootId: NodeId;
  nodes: Record<NodeId, SiteNode>;
  scopes: Record<string, { kind: 'document' | 'shadow'; hostId?: NodeId; parentScopeId?: string }>;
  styles?: Record<StyleId, StyleDescriptor>;
  stats: {
    /** Composed elements visited, including ignored subtrees; not template contents or unassigned light DOM. */
    scannedElements: number; includedElements: number; ignoredElements: number; uniqueStyles: number;
    scanDurationMs: number;
  };
  coverage: { tree: 'composed-open-shadow'; iframes: 'boundary-only'; truncated: boolean };
}
