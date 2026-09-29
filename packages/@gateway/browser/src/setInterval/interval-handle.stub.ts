/// <reference lib="dom" />
/**
 * PURPOSE: A real `setInterval` handle, produced by scheduling a callback through
 * `#gateway/browser/setInterval` and cancelling it at once so nothing fires — for a caller staging a
 * handle without hand-typing the environment's own handle shape.
 *
 * USAGE:
 * const handle = IntervalHandleStub();
 */
import { setInterval } from './setInterval';

export const IntervalHandleStub = (): ReturnType<typeof globalThis.setInterval> => {
  const handle = setInterval(() => undefined, 0);
  globalThis.clearInterval(handle);
  return handle;
};
