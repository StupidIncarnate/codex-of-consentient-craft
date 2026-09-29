/// <reference lib="dom" />
/**
 * PURPOSE: A real `HTMLElement` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/HTMLElement`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = HtmlElementStub();
 */

export const HtmlElementStub = ({ tagName = 'div' }: { tagName?: string } = {}): HTMLElement =>
  globalThis.document.createElement(tagName);
