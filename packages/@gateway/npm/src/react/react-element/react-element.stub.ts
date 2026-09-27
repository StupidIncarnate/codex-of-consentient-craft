/**
 * PURPOSE: A real `ReactElement`, built through the real `createElement()` — for a caller staging
 * this subpath's own value instead of hand-typing a fake element. Typed as the exact overload
 * `createElement('div', ...)` returns, so `.props.children` stays a real, readable field rather
 * than the bare `ReactElement`'s own default (`unknown`) props.
 *
 * USAGE:
 * const element = ReactElementStub();
 * // Returns a real <div>gateway-stub</div> ReactElement
 */
import { createElement } from 'react';
import type { DetailedReactHTMLElement, HTMLAttributes } from 'react';

export const ReactElementStub = ({
  text = 'gateway-stub',
}: {
  text?: string;
} = {}): DetailedReactHTMLElement<HTMLAttributes<HTMLDivElement>, HTMLDivElement> =>
  createElement('div', null, text);
