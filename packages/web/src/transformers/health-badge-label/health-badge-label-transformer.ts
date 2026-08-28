/**
 * PURPOSE: Renders a HealthBadgeState as the exact text the badge shows on screen — the bare
 * state word for checking, degraded and offline, with the formatted uptime appended after a
 * single space only in the online state. Reach for this over health-badge-title-transformer,
 * which renders the same state as the badge's hover title rather than its visible label.
 *
 * USAGE:
 * healthBadgeLabelTransformer({badgeState: {state: 'online', uptimeSeconds: 11520}});
 * // Returns 'ONLINE 3h 12m' as DisplayLabel
 */

import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { HealthBadgeState } from '../../contracts/health-badge-state/health-badge-state-contract';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';
import { formatUptimeTransformer } from '../format-uptime/format-uptime-transformer';

export const healthBadgeLabelTransformer = ({
  badgeState,
}: {
  badgeState: HealthBadgeState;
}): DisplayLabel => {
  if (badgeState.state === 'online') {
    const uptime = formatUptimeTransformer({ uptimeSeconds: badgeState.uptimeSeconds });
    return displayLabelContract.parse(`${healthBadgeStatics.online} ${uptime}`);
  }
  if (badgeState.state === 'degraded') {
    return displayLabelContract.parse(healthBadgeStatics.degraded);
  }
  if (badgeState.state === 'offline') {
    return displayLabelContract.parse(healthBadgeStatics.offline);
  }
  return displayLabelContract.parse(healthBadgeStatics.checking);
};
