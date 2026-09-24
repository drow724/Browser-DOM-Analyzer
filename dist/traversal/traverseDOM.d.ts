/** Rendered/composed children: open shadow replaces light DOM; slots distribute assigned nodes once. */
export declare function composedChildren(el: Element): Node[];
export interface Visit {
    element: Element;
    parent?: Element;
    scopeHost?: Element;
}
/** Iterative preorder; does not recurse on JS stack or mutate DOM. */
export declare function traverseDOM(root: Element): Generator<Visit>;
