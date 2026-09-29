/**
 * PURPOSE: Queues a callback ahead of the promise microtask queue and every timer. Reach for this
 * over `process.nextTick` directly when a caller needs "after the current call finishes, before
 * anything else runs".
 *
 * USAGE:
 * nextTick(() => emitClose());
 * // emitClose runs once the current synchronous work is done
 */

export const nextTick = (callback: () => void): void => {
  process.nextTick(callback);
};
