/**
 * PURPOSE: Holds the timers the watch adapter has announced, and answers which of them are still
 * holding the event loop open. Internal to the jest setup file — reach for `openHandleReportBroker`
 * instead from anywhere that wants findings, since that one names the suite and writes the report.
 *
 * `clear` is called once per test FILE rather than once per run, which is what keeps the list the
 * size of one suite's timers instead of a whole worker's.
 *
 * USAGE:
 * openHandleTrackingBroker.watch();
 * openHandleTrackingBroker.pending();
 * // Returns the armed timers that are un-cleared, un-fired and still ref-ed
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { timersWatchAdapter } from '../../../adapters/timers/watch/timers-watch-adapter';
import type { ArmedTimer } from '../../../contracts/armed-timer/armed-timer-contract';

const armedTimers: ArmedTimer[] = [];

export const openHandleTrackingBroker = {
  watch: (): AdapterResult =>
    timersWatchAdapter({
      onArm: ({ armed }: { armed: ArmedTimer }): void => {
        armedTimers.push(armed);
      },
    }),

  pending: (): readonly ArmedTimer[] => armedTimers.filter((armed) => armed.isPending()),

  clear: (): void => {
    armedTimers.length = 0;
  },
};
