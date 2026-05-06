/**
 * PURPOSE: Formats a seconds-until-reset count as a compact human-readable string ('2h5m', '4d11h', '15m')
 *
 * USAGE:
 * formatResetDurationTransformer({ seconds: 7500 });
 * // Returns: '2h5m'
 *
 * Logic mirrors statusline-command.sh:54-62 (`fmt_duration` bash function).
 */

import {
  resetDurationLabelContract,
  type ResetDurationLabel,
} from '../../contracts/reset-duration-label/reset-duration-label-contract';

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3600;
const DAY_SECONDS = 86_400;

export const formatResetDurationTransformer = ({
  seconds,
}: {
  seconds: number;
}): ResetDurationLabel => {
  if (seconds <= 0) {
    return resetDurationLabelContract.parse('0m');
  }

  const days = Math.floor(seconds / DAY_SECONDS);
  const hours = Math.floor((seconds % DAY_SECONDS) / HOUR_SECONDS);
  const minutes = Math.floor((seconds % HOUR_SECONDS) / MINUTE_SECONDS);

  if (days > 0) {
    return resetDurationLabelContract.parse(`${String(days)}d${String(hours)}h`);
  }
  if (hours > 0) {
    return resetDurationLabelContract.parse(`${String(hours)}h${String(minutes)}m`);
  }
  return resetDurationLabelContract.parse(`${String(minutes)}m`);
};
