/// <reference lib="dom" />
/**
 * PURPOSE: A real `HTMLImageElement` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/HTMLImageElement`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = HtmlImageElementStub();
 */

export const HtmlImageElementStub = ({
  src = 'data:image/png;base64,AAAA',
}: { src?: string } = {}): HTMLImageElement => {
  const image = globalThis.document.createElement('img');
  image.src = src;
  return image;
};
