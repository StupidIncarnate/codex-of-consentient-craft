/// <reference lib="dom" />
/**
 * PURPOSE: Schedules a interval through the browser global `setInterval`. The global is read at CALL time,
 * not destructured at module load: jest fake timers and `registerSpyOn` replace the property on
 * `globalThis` after this module is imported, and a load-time copy would keep pointing at the
 * real function.
 *
 * USAGE:
 * const handle = setInterval(() => { ... }, 250);
 * // Returns the environment's own handle; pass it to `clearInterval`
 */

export const setInterval = (
  handler: (...args: never[]) => void,
  timeout?: number,
): ReturnType<typeof globalThis.setInterval> => globalThis.setInterval(handler, timeout);
