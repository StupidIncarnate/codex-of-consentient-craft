/**
 * PURPOSE: Compares a heartbeat's age against the badge's silence threshold from two plain
 * numbers, so the 29s/30s boundary is provable with no timer. Reach for this over an inline
 * comparison at the call site because useHealthStatusBinding's silence tick and this guard's own
 * tests both need the same boundary logic to agree on the inclusive edge.
 *
 * USAGE:
 * isHeartbeatSilentGuard({ lastHeartbeatAt, now: Date.now() });
 * // Returns true once `now` is at least healthBadgeStatics.silenceThresholdMs past lastHeartbeatAt
 */

import type { HealthBadgeState } from '../../contracts/health-badge-state/health-badge-state-contract';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';

type HealthBadgeOnlineState = Extract<HealthBadgeState, { state: 'online' }>;

export const isHeartbeatSilentGuard = ({
  lastHeartbeatAt,
  now,
}: {
  lastHeartbeatAt?: HealthBadgeOnlineState['lastHeartbeatAt'];
  now?: number;
}): boolean => {
  if (lastHeartbeatAt === undefined || now === undefined) {
    return false;
  }
  const elapsedMs = now - new Date(lastHeartbeatAt).getTime();
  return elapsedMs >= healthBadgeStatics.silenceThresholdMs;
};
