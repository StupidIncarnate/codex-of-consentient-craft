/**
 * PURPOSE: A real, already-cleared `setTimeout` handle, for code that only needs to hold a
 * `NodeJS.Timeout`-shaped value that will never actually fire. Arms the real timer then clears it
 * immediately, so every method the real handle carries (`.ref()`, `.unref()`, `.hasRef()`,
 * `.refresh()`) is the genuine implementation, never a hand-shaped stand-in.
 *
 * USAGE:
 * const handle = TimeoutStub();
 * // Returns a real, cleared NodeJS.Timeout; handle.hasRef() is true
 * const unrefd = TimeoutStub({ unref: true });
 * // Returns the same, after .unref() — unrefd.hasRef() is false
 */

export const TimeoutStub = ({ unref = false }: { unref?: boolean } = {}): NodeJS.Timeout => {
  const handle = globalThis.setTimeout(() => undefined, 0);
  globalThis.clearTimeout(handle);

  if (unref) {
    handle.unref();
  }

  return handle;
};
