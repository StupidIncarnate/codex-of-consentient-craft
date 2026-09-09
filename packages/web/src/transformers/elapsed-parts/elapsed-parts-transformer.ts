/**
 * PURPOSE: The one elapsed-time calculation this app has — floors a millisecond gap into whole
 * hours, minutes and seconds. The end of the span is a PARAMETER, never `Date.now()` read inside
 * here, because that is what lets this single calculation serve both a finished work item (end
 * point = its `completedAt`) and a still-running one (end point = a freshly-minted "now"): the
 * caller decides which, and this file stays agnostic to which is running.
 *
 * USAGE:
 * elapsedPartsTransformer({startedAt, endedAt});
 * // Returns {hours: 1, minutes: 15, seconds: 30} as a branded ElapsedParts
 */

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { elapsedPartsContract } from '../../contracts/elapsed-parts/elapsed-parts-contract';
import type { ElapsedParts } from '../../contracts/elapsed-parts/elapsed-parts-contract';

// Unit conversions only, not display thresholds — the bands that decide when a shown figure
// switches from seconds to minutes to hours live in statics/elapsed-display-config/.
const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export const elapsedPartsTransformer = ({
  startedAt,
  endedAt,
}: {
  startedAt: IsoTimestamp;
  endedAt: IsoTimestamp;
}): ElapsedParts => {
  const ms = new Date(String(endedAt)).getTime() - new Date(String(startedAt)).getTime();
  const totalSeconds = Math.max(Math.floor(ms / MILLIS_PER_SECOND), 0);
  const secondsPerHour = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  return elapsedPartsContract.parse({
    hours: Math.floor(totalSeconds / secondsPerHour),
    minutes: Math.floor((totalSeconds % secondsPerHour) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  });
};
