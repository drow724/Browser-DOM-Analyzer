import { analyzeDOMWithBindings, type AnalyzeOptions } from '../analyzer/analyzeDOM.js';
import type { NodeId, SiteDOMModel } from '../model/SiteDOMModel.js';

export interface DOMSnapshot {
  readonly model: SiteDOMModel;
  resolve(nodeId: NodeId): Element | null;
  getNodeId(element: Element): NodeId | undefined;
  isConnected(nodeId: NodeId): boolean;
  isStale(): boolean;
  dispose(): void;
}

/**
 * Browser-only runtime snapshot. The serialized model never contains live Elements.
 * Mutations mark the immutable snapshot stale instead of reconciling it in place.
 */
export function createDOMSnapshot(document: Document, options: AnalyzeOptions = {}): DOMSnapshot {
  const { model, bindings } = analyzeDOMWithBindings(document, options);
  const win = document.defaultView;
  if (!win || !document.documentElement) {
    throw new TypeError('createDOMSnapshot requires a live browser Document');
  }

  let stale = false;
  let disposed = false;
  const observer = new win.MutationObserver(() => { stale = true; });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  const checkPendingMutations = () => {
    if (!stale && observer.takeRecords().length > 0) stale = true;
  };

  return {
    model,
    resolve(nodeId) {
      if (disposed) return null;
      return bindings.nodeById.get(nodeId) ?? null;
    },
    getNodeId(element) {
      if (disposed) return undefined;
      return bindings.idByElement.get(element);
    },
    isConnected(nodeId) {
      if (disposed) return false;
      const element = bindings.nodeById.get(nodeId);
      return Boolean(element?.isConnected && element.ownerDocument === document);
    },
    isStale() {
      if (disposed) return true;
      checkPendingMutations();
      return stale;
    },
    dispose() {
      if (disposed) return;
      observer.disconnect();
      bindings.nodeById.clear();
      disposed = true;
      stale = true;
    },
  };
}
