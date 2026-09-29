/// <reference lib="dom" />
/**
 * PURPOSE: A handle that `#gateway/browser/clearTimeout` has already cancelled — scheduled through the
 * environment's own `setTimeout` and cleared through the wrapper. For a caller that needs a
 * genuinely spent handle rather than a hand-typed one.
 *
 * USAGE:
 * const handle = ClearedTimeoutHandleStub();
 */
import { clearTimeout } from './clearTimeout';

export const ClearedTimeoutHandleStub = (): ReturnType<typeof globalThis.setTimeout> => {
  const handle = globalThis.setTimeout(() => undefined, 0);
  clearTimeout(handle);
  return handle;
};
