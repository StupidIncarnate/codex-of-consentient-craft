/// <reference lib="dom" />
/**
 * PURPOSE: A real `setTimeout` handle, produced by scheduling a callback through
 * `#gateway/browser/setTimeout` and cancelling it at once so nothing fires — for a caller staging a
 * handle without hand-typing the environment's own handle shape.
 *
 * USAGE:
 * const handle = TimeoutHandleStub();
 */
import { setTimeout } from './setTimeout';

export const TimeoutHandleStub = (): ReturnType<typeof globalThis.setTimeout> => {
  const handle = setTimeout(() => undefined, 0);
  globalThis.clearTimeout(handle);
  return handle;
};
