/// <reference lib="dom" />
/**
 * PURPOSE: Schedules a timeout through the browser global `setTimeout`. The global is read at CALL time,
 * not destructured at module load: jest fake timers and `registerSpyOn` replace the property on
 * `globalThis` after this module is imported, and a load-time copy would keep pointing at the
 * real function.
 *
 * USAGE:
 * const handle = setTimeout(() => { ... }, 250);
 * // Returns the environment's own handle; pass it to `clearTimeout`
 */

export const setTimeout = (
  handler: (...args: never[]) => void,
  timeout?: number,
): ReturnType<typeof globalThis.setTimeout> => globalThis.setTimeout(handler, timeout);
