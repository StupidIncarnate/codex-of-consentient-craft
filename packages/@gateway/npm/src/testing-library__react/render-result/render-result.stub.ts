/**
 * PURPOSE: A real `RenderResult`, built through the real `render()` — for a caller staging this
 * subpath's own value instead of hand-typing a fake result. Needs a real `document`, hence
 * `@jest-environment jsdom` on this stub's own companion test — this package's default Jest
 * environment is `node`.
 *
 * USAGE:
 * const result = RenderResultStub();
 * // Returns the real RenderResult for a rendered <div>gateway-stub</div>
 */
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { createElement } from 'react';

export const RenderResultStub = ({ text = 'gateway-stub' }: { text?: string } = {}): RenderResult =>
  render(createElement('div', null, text));
