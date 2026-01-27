/**
 * PURPOSE: Wraps global setTimeout for scheduling delayed callbacks
 *
 * USAGE:
 * const timerId = timerSetTimeoutAdapter({ callback: () => {}, delayMs: TimeoutMsStub({ value: 1000 }) });
 * // Returns timer ID for cancellation
 */

import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { timerIdContract, type TimerId } from '../../../contracts/timer-id/timer-id-contract';

export const timerSetTimeoutAdapter = ({
  callback,
  delayMs,
}: {
  callback: () => void;
  delayMs: TimeoutMs;
}): TimerId => timerIdContract.parse(setTimeout(callback, delayMs));
