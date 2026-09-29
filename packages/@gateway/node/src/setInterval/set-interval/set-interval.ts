/**
 * PURPOSE: Schedules a repeating timer through the Node global `setInterval`. The global is read at
 * CALL time, not destructured at module load: `registerSpyOn`, jest's fake timers and the open-handle
 * watcher replace the property on `globalThis` after this module is imported, and a load-time copy
 * would keep pointing at the real function and bypass them.
 *
 * USAGE:
 * const handle = setInterval(() => { ... }, 5000);
 * // Returns the real NodeJS.Timeout; pass it to `clearInterval`
 */

export const setInterval = (callback: (...args: never[]) => void, ms?: number): NodeJS.Timeout =>
  globalThis.setInterval(callback, ms);
