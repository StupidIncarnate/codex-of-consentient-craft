/**
 * PURPOSE: A real `setImmediate` handle already cleared once, for exercising
 * `#gateway/node/clearImmediate` against a genuine `NodeJS.Immediate` argument — clearing an
 * already-cleared handle is a documented no-op.
 *
 * USAGE:
 * const handle = ImmediateHandleStub();
 * clearImmediate(handle); // no-op — already cleared once during construction
 */

export const ImmediateHandleStub = (): NodeJS.Immediate => {
  const handle = globalThis.setImmediate(() => undefined);
  globalThis.clearImmediate(handle);
  return handle;
};
