/**
 * PURPOSE: A real timer handle already cleared once, for exercising `#gateway/node/clearTimeout`
 * itself against a genuine `NodeJS.Timeout` argument — clearing an already-cleared handle is a
 * documented no-op, so this doubles as the value a second `clearTimeout` call is safe against.
 *
 * USAGE:
 * const handle = TimeoutHandleStub();
 * clearTimeout(handle); // no-op — already cleared once during construction
 */

export const TimeoutHandleStub = (): NodeJS.Timeout => {
  const handle = globalThis.setTimeout(() => undefined, 0);
  globalThis.clearTimeout(handle);
  return handle;
};
