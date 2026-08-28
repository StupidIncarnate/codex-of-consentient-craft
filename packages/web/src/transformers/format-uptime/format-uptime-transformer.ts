/**
 * PURPOSE: Converts a server's uptime, in seconds, into the badge's Xh Ym display string. Hours
 * never roll into days, so the top bar's single line never changes shape as a server ages. Reach
 * for this over duration-display-transformer, which formats the elapsed span between two
 * timestamps rather than a raw duration already in seconds.
 *
 * USAGE:
 * formatUptimeTransformer({uptimeSeconds: 11520});
 * // Returns '3h 12m' as DisplayLabel
 */

import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

export const formatUptimeTransformer = ({
  uptimeSeconds,
}: {
  uptimeSeconds: HealthStatusPayload['uptimeSeconds'];
}): DisplayLabel => {
  const hours = Math.floor(uptimeSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((uptimeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return displayLabelContract.parse(`${String(hours)}h ${String(minutes)}m`);
};
