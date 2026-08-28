/**
 * PURPOSE: Turns the health badge's one seed request into a badge state, so nothing downstream has
 * to branch on a raw fetch result. Reach for this over calling fetchGetWithStatusAdapter directly
 * when the caller wants the online/degraded/offline shape rather than a status/ok/body triple — the
 * three ways this request can fail (a bad status, an unreachable server, an unparsable body) all
 * collapse to the offline branch here instead of being decided again at every call site.
 *
 * USAGE:
 * const badgeState = await healthStatusGetBroker();
 * // Returns HealthBadgeState — online/degraded on a 200 with a valid body, offline with
 * // offlineCause 'server-error' on a non-2xx status or an unparsable 200 body, offline with
 * // offlineCause 'unreachable' when the request never reaches the server.
 */

import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts';

import { fetchGetWithStatusAdapter } from '../../../adapters/fetch/get-with-status/fetch-get-with-status-adapter';
import { healthBadgeStateContract } from '../../../contracts/health-badge-state/health-badge-state-contract';
import type { HealthBadgeState } from '../../../contracts/health-badge-state/health-badge-state-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';
import { healthPayloadToBadgeStateTransformer } from '../../../transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer';

export const healthStatusGetBroker = async (): Promise<HealthBadgeState> => {
  try {
    const result = await fetchGetWithStatusAdapter({
      url: webConfigStatics.api.routes.healthStatus,
    });

    if (!result.ok) {
      return healthBadgeStateContract.parse({
        state: 'offline',
        offlineCause: 'server-error',
        offlineStatusCode: result.status,
      });
    }

    const parsedPayload = healthStatusPayloadContract.safeParse(result.body);
    if (!parsedPayload.success) {
      return healthBadgeStateContract.parse({
        state: 'offline',
        offlineCause: 'server-error',
      });
    }

    return healthPayloadToBadgeStateTransformer({
      payload: parsedPayload.data,
      lastHeartbeatAt: null,
    });
  } catch {
    return healthBadgeStateContract.parse({
      state: 'offline',
      offlineCause: 'unreachable',
    });
  }
};
