/**
 * PURPOSE: Wraps setTimeout as an awaitable promise so callers can sleep for a fixed interval, and proxies can mock the timer for unit tests
 *
 * USAGE:
 * await timerSetTimeoutAdapter({ ms: 200 });
 * // Resolves after ~200ms. Under proxy control, resolves immediately. `setTimeout`'s callback
 * // fires with no arguments, so there is nothing real to report back — the caller already knows
 * // `ms`, the one thing a naive echo would return (R1: a value that only ever restates its own
 * // input says nothing more than void would).
 */

export const timerSetTimeoutAdapter = async ({ ms }: { ms: number }): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
