/**
 * PURPOSE: Queues a callback on the microtask queue, so it runs after the current synchronous work
 * and before any timer or immediate. Reads `globalThis.queueMicrotask` when called.
 *
 * USAGE:
 * queueMicrotask(() => settle());
 * // settle() runs once the current call stack empties
 */

export const queueMicrotask = (callback: () => void): void => {
  globalThis.queueMicrotask(callback);
};
