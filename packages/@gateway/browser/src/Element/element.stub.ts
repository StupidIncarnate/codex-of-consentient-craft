/// <reference lib="dom" />
/**
 * PURPOSE: A real `Element` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/Element`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = ElementStub();
 */

export const ElementStub = ({ tagName = 'div' }: { tagName?: string } = {}): Element =>
  globalThis.document.createElement(tagName);
