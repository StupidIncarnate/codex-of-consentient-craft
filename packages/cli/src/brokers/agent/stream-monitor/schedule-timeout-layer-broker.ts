/**
 * PURPOSE: Schedules or reschedules a timeout that kills the process on inactivity
 *
 * USAGE:
 * const timerId = scheduleTimeoutLayerBroker({ state, childProcess, timeoutMs });
 * // Returns new timer ID after scheduling timeout
 */

import { timerSetTimeoutAdapter } from '../../../adapters/timer/set-timeout/timer-set-timeout-adapter';
import { timerClearTimeoutAdapter } from '../../../adapters/timer/clear-timeout/timer-clear-timeout-adapter';
import { timedOutFlagContract } from '../../../contracts/timed-out-flag/timed-out-flag-contract';
import type { MonitorState } from '../../../contracts/monitor-state/monitor-state-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { TimerId } from '../../../contracts/timer-id/timer-id-contract';
import type { EventEmittingProcess } from '../../../contracts/event-emitting-process/event-emitting-process-contract';

export const scheduleTimeoutLayerBroker = ({
  state,
  childProcess,
  timeoutMs,
}: {
  state: MonitorState;
  childProcess: EventEmittingProcess;
  timeoutMs: TimeoutMs;
}): TimerId => {
  if (state.timerId) {
    timerClearTimeoutAdapter({ timerId: state.timerId });
  }

  return timerSetTimeoutAdapter({
    callback: (): void => {
      state.timedOut = timedOutFlagContract.parse(true);
      childProcess.kill();
    },
    delayMs: timeoutMs,
  });
};
