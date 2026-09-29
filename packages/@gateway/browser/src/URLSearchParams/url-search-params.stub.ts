/// <reference lib="dom" />
/**
 * PURPOSE: A real `URLSearchParams` instance built through the environment's own constructor or factory —
 * for a caller staging `#gateway/browser/URLSearchParams`'s value without hand-typing a fake one.
 *
 * USAGE:
 * const value = UrlSearchParamsStub();
 */
import { URLSearchParams } from './URLSearchParams';

export const UrlSearchParamsStub = ({
  query = 'a=1&b=2',
}: { query?: string } = {}): URLSearchParams => new URLSearchParams(query);
