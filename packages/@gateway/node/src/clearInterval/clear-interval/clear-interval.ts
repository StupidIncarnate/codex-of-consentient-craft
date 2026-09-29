/**
 * PURPOSE: Cancels a repeating timer through the Node global `clearInterval`. The global is read at
 * CALL time, like `#gateway/node/setInterval`: a timer armed through a spied, faked or instrumented
 * global must be cancelled through that same global, and a load-time copy of the real function would
 * leave the instrumented one believing the timer is still armed.
 *
 * USAGE:
 * clearInterval(handle);
 * // Cancels the timer; a handle already cleared is a no-op
 */

export const clearInterval = (handle: Parameters<typeof globalThis.clearInterval>[0]): void => {
  globalThis.clearInterval(handle);
};
