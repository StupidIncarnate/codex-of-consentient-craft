/**
 * PURPOSE: Computes the health badge's title attribute — the hover text naming WHY the badge is
 * offline, since the rendered label itself stays the single word OFFLINE for every cause. Reach
 * for this over health-badge-label-transformer when the target is the title attribute rather than
 * the badge's own text; the two are read independently and this file does not import that one.
 *
 * USAGE:
 * healthBadgeTitleTransformer({ badgeState: { state: 'offline', offlineCause: 'silence' } });
 * // Returns 'No heartbeat for 30 seconds' as DisplayLabel
 */

import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import type { HealthBadgeState } from '../../contracts/health-badge-state/health-badge-state-contract';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';

export const healthBadgeTitleTransformer = ({
  badgeState,
}: {
  badgeState: HealthBadgeState;
}): DisplayLabel => {
  switch (badgeState.state) {
    case 'checking':
      return displayLabelContract.parse(healthBadgeStatics.checking);
    case 'online':
      return displayLabelContract.parse(healthBadgeStatics.online);
    case 'degraded':
      return displayLabelContract.parse(healthBadgeStatics.degraded);
    case 'offline': {
      const { offlineCause, offlineStatusCode } = badgeState;
      switch (offlineCause) {
        case 'unreachable':
          return displayLabelContract.parse(healthBadgeStatics.offlineTitleUnreachable);
        case 'server-error':
          return displayLabelContract.parse(
            offlineStatusCode === undefined
              ? healthBadgeStatics.offlineTitleServerError
              : `${healthBadgeStatics.offlineTitleServerError} ${String(offlineStatusCode)}`,
          );
        case 'silence':
          return displayLabelContract.parse(healthBadgeStatics.offlineTitleSilence);
        default:
          throw new Error(`Unreachable offlineCause: ${String(offlineCause)}`);
      }
    }
    default:
      throw new Error('Unreachable healthBadgeTitleTransformer badgeState.state');
  }
};
