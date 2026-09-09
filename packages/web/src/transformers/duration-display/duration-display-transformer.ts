/**
 * PURPOSE: Formats one elapsed-time span into the label a work-item row shows beside its status.
 * It is the single formatting function for that label whether the row is still running or has
 * already finished — by the time `elapsedParts` reaches here the caller has already picked the
 * end point (`Date.now()` for a running row, `completedAt` for a finished one), so this file has
 * no way to tell the two cases apart and does not need to.
 *
 * USAGE:
 * durationDisplayTransformer({elapsedParts: ElapsedPartsStub({minutes: 4})});
 * // Returns '4m' as a branded DisplayLabel
 */

import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

import type { ElapsedParts } from '../../contracts/elapsed-parts/elapsed-parts-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';

export const durationDisplayTransformer = ({
  elapsedParts,
}: {
  elapsedParts: ElapsedParts;
}): DisplayLabel => {
  const { minuteThresholdSeconds, hourThresholdMinutes } = elapsedDisplayConfigStatics.thresholds;
  const { hours, minutes, seconds } = elapsedParts;
  const totalMinutes = Number(hours) * hourThresholdMinutes + Number(minutes);
  const totalSeconds = totalMinutes * minuteThresholdSeconds + Number(seconds);

  if (totalSeconds < minuteThresholdSeconds) {
    return displayLabelContract.parse('<1m');
  }
  if (totalMinutes < hourThresholdMinutes) {
    return displayLabelContract.parse(`${String(totalMinutes)}m`);
  }
  // A whole hour prints `1h`, not `1h0m` — the zero carries no information.
  return displayLabelContract.parse(
    Number(minutes) === 0 ? `${String(hours)}h` : `${String(hours)}h${String(minutes)}m`,
  );
};
