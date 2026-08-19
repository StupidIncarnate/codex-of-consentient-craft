/**
 * PURPOSE: Formats a server uptime seconds count as a compact duration token ('45s', '12m',
 * '1h2m') for the app header's health badge
 *
 * USAGE:
 * formatUptimeTransformer({ seconds: 745 });
 * // Returns: '12m'
 */

import {
  uptimeLabelContract,
  type UptimeLabel,
} from '../../contracts/uptime-label/uptime-label-contract';

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3600;

export const formatUptimeTransformer = ({ seconds }: { seconds: number }): UptimeLabel => {
  if (seconds < MINUTE_SECONDS) {
    return uptimeLabelContract.parse(`${String(seconds)}s`);
  }
  if (seconds < HOUR_SECONDS) {
    return uptimeLabelContract.parse(`${String(Math.floor(seconds / MINUTE_SECONDS))}m`);
  }
  const hours = Math.floor(seconds / HOUR_SECONDS);
  const minutes = Math.floor((seconds % HOUR_SECONDS) / MINUTE_SECONDS);
  return uptimeLabelContract.parse(`${String(hours)}h${String(minutes)}m`);
};
