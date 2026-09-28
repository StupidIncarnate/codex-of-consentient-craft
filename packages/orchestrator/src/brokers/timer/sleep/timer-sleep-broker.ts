/**
 * PURPOSE: Awaitable delay for a caller that waits a fixed interval between polls or retries.
 * Resolves with nothing: `setTimeout`'s callback fires with no arguments, and echoing `ms` back
 * would say no more than the caller already knows.
 *
 * USAGE:
 * await timerSleepBroker({ ms: 200 });
 * // Resolves after ~200ms. Under the proxy, resolves at once.
 */

import { setTimeout } from '#gateway/node/setTimeout';

export const timerSleepBroker = async ({ ms }: { ms: number }): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
