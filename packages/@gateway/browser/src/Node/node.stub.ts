/// <reference lib="dom" />
/**
 * PURPOSE: A real `Node` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/Node`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = NodeStub();
 */

export const NodeStub = ({ data = 'a note' }: { data?: string } = {}): Node =>
  globalThis.document.createComment(data);
