/// <reference lib="dom" />
/**
 * PURPOSE: A handle that `#gateway/browser/clearInterval` has already cancelled — scheduled through the
 * environment's own `setInterval` and cleared through the wrapper. For a caller that needs a
 * genuinely spent handle rather than a hand-typed one.
 *
 * USAGE:
 * const handle = ClearedIntervalHandleStub();
 */
import { clearInterval } from './clearInterval';

export const ClearedIntervalHandleStub = (): ReturnType<typeof globalThis.setInterval> => {
  const handle = globalThis.setInterval(() => undefined, 0);
  clearInterval(handle);
  return handle;
};
