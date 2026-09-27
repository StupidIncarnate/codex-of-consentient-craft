/**
 * PURPOSE: A real, already-cleared `setInterval` handle, for code that only needs to hold a
 * `NodeJS.Timeout`-shaped value that will never actually fire. Arms the real repeating timer then
 * clears it immediately, so every method the real handle carries (`.ref()`, `.unref()`,
 * `.hasRef()`, `.refresh()`) is the genuine implementation, never a hand-shaped stand-in.
 *
 * USAGE:
 * const handle = IntervalHandleStub();
 * // Returns a real, cleared NodeJS.Timeout; handle.hasRef() is true
 */

export const IntervalHandleStub = (): NodeJS.Timeout => {
  const handle = globalThis.setInterval(() => undefined, 0);
  globalThis.clearInterval(handle);
  return handle;
};
