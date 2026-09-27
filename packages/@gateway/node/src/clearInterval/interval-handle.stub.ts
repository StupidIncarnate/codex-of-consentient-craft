/**
 * PURPOSE: A real interval handle already cleared once, for exercising `#gateway/node/clearInterval`
 * itself against a genuine `NodeJS.Timeout` argument — clearing an already-cleared handle is a
 * documented no-op, so this doubles as the value a second `clearInterval` call is safe against.
 *
 * USAGE:
 * const handle = IntervalHandleStub();
 * clearInterval(handle); // no-op — already cleared once during construction
 */

export const IntervalHandleStub = (): NodeJS.Timeout => {
  const handle = globalThis.setInterval(() => undefined, 0);
  globalThis.clearInterval(handle);
  return handle;
};
