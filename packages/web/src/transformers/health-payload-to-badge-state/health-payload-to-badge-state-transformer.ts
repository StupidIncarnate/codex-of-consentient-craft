/**
 * PURPOSE: The one construction site for the badge's online and degraded states from a wire
 * HealthStatusPayload, so the seed broker and the heartbeat binding cannot build two different
 * shapes out of the same payload. The two offline branches are NOT built here — a broker or
 * binding parses those itself from a failed request or from heartbeat silence.
 *
 * USAGE:
 * healthPayloadToBadgeStateTransformer({payload: {status: 'ok', uptimeSeconds: 11520, version: '1.4.0'}, lastHeartbeatAt: null});
 * // Returns HealthBadgeState — the online branch, with no lastHeartbeatAt key
 */

import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

import { healthBadgeStateContract } from '../../contracts/health-badge-state/health-badge-state-contract';
import type { HealthBadgeState } from '../../contracts/health-badge-state/health-badge-state-contract';

type IsoTimestamp = NonNullable<Extract<HealthBadgeState, { state: 'online' }>['lastHeartbeatAt']>;

export const healthPayloadToBadgeStateTransformer = ({
  payload,
  lastHeartbeatAt,
}: {
  payload: HealthStatusPayload;
  lastHeartbeatAt: IsoTimestamp | null;
}): HealthBadgeState => {
  const heartbeatFields = lastHeartbeatAt === null ? {} : { lastHeartbeatAt };
  if (payload.status === 'ok') {
    return healthBadgeStateContract.parse({
      state: 'online',
      uptimeSeconds: payload.uptimeSeconds,
      ...heartbeatFields,
    });
  }
  return healthBadgeStateContract.parse({
    state: 'degraded',
    ...heartbeatFields,
  });
};
