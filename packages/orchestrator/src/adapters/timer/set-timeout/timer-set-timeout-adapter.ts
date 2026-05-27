/**
 * PURPOSE: Wraps setTimeout as an awaitable promise so callers can sleep for a fixed interval, and proxies can mock the timer for unit tests
 *
 * USAGE:
 * const { elapsedMs } = await timerSetTimeoutAdapter({ ms: 200 });
 * // Resolves after ~200ms with the requested delay echoed back. Under proxy control, resolves immediately.
 */

import {
  elapsedMsContract,
  type ElapsedMs,
} from '../../../contracts/elapsed-ms/elapsed-ms-contract';

export interface TimerSetTimeoutResult {
  elapsedMs: ElapsedMs;
}

export const timerSetTimeoutAdapter = async ({
  ms,
}: {
  ms: number;
}): Promise<TimerSetTimeoutResult> =>
  new Promise<TimerSetTimeoutResult>((resolve) => {
    setTimeout(() => {
      resolve({ elapsedMs: elapsedMsContract.parse(ms) });
    }, ms);
  });
