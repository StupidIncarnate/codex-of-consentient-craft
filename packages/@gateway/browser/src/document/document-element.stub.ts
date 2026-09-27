/**
 * PURPOSE: A real DOM element, built through `#gateway/browser/document`'s own wrapped
 * `document.createElement` — for a caller staging a genuine `Element` rather than a hand-typed one.
 *
 * USAGE:
 * const element = DocumentElementStub({ tagName: 'div' });
 */
import { document } from './document';

export const DocumentElementStub = ({ tagName = 'div' }: { tagName?: string } = {}): HTMLElement =>
  document.createElement(tagName);
