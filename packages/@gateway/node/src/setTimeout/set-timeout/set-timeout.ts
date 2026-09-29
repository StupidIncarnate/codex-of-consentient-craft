/**
 * PURPOSE: Schedules a timeout through the Node global `setTimeout`. The global is read at CALL
 * time, not destructured at module load: `registerSpyOn` and fake timers replace the property on
 * `globalThis` after this module is imported, and a load-time copy would keep pointing at the real
 * function.
 *
 * USAGE:
 * const handle = setTimeout(() => { ... }, 250);
 * // Returns the real NodeJS.Timeout; pass it to `clearTimeout`
 */

export const setTimeout = (callback: (...args: never[]) => void, ms?: number): NodeJS.Timeout =>
  globalThis.setTimeout(callback, ms);
