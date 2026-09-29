/**
 * PURPOSE: A real `setImmediate` handle already cleared, for code that only needs to hold a
 * `NodeJS.Immediate`-shaped value that will never actually run. Arms the real immediate then
 * clears it, so `.ref()`, `.unref()` and `.hasRef()` are the genuine implementation.
 *
 * USAGE:
 * const handle = ImmediateHandleStub();
 * // Returns a real, cleared NodeJS.Immediate; handle.hasRef() is false, as for any cleared immediate
 */

export const ImmediateHandleStub = (): NodeJS.Immediate => {
  const handle = globalThis.setImmediate(() => undefined);
  globalThis.clearImmediate(handle);
  return handle;
};
