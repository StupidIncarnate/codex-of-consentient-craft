/**
 * PURPOSE: Cancels a timer through the Node global `clearTimeout`. The global is read at CALL time,
 * like `#gateway/node/setTimeout`: a timer armed through a spied or instrumented global must be
 * cancelled through that same global, and a load-time copy of the real function would leave the
 * instrumented one believing the timer is still armed.
 *
 * USAGE:
 * clearTimeout(handle);
 * // Cancels the timer; a handle already fired or cleared is a no-op
 */

export const clearTimeout = (handle: Parameters<typeof globalThis.clearTimeout>[0]): void => {
  globalThis.clearTimeout(handle);
};
