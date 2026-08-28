/**
 * PURPOSE: Keeps the top-bar health badge's state alive across its whole lifetime — one seed at
 * mount, every heartbeat frame the shared channel routes through, a silence tick that flips the
 * badge OFFLINE when frames stop arriving, and a manual retry. Reach for this over calling
 * healthStatusGetBroker directly when the caller is the badge itself: everything else here (the
 * heartbeat subscription, the silence tick) has no broker of its own to wrap.
 *
 * USAGE:
 * const { badgeState, retry } = useHealthStatusBinding();
 * // badgeState starts as the checking branch, then tracks the seed response, live heartbeats and
 * // heartbeat silence; retry() re-issues the seed request.
 */

import { useCallback, useEffect, useState } from 'react';

import { healthStatusGetBroker } from '../../brokers/health-status/get/health-status-get-broker';
import { healthBadgeStateContract } from '../../contracts/health-badge-state/health-badge-state-contract';
import type { HealthBadgeState } from '../../contracts/health-badge-state/health-badge-state-contract';
import { isHeartbeatSilentGuard } from '../../guards/is-heartbeat-silent/is-heartbeat-silent-guard';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { healthPayloadToBadgeStateTransformer } from '../../transformers/health-payload-to-badge-state/health-payload-to-badge-state-transformer';

export const useHealthStatusBinding = (): {
  badgeState: HealthBadgeState;
  retry: () => void;
} => {
  const [badgeState, setBadgeState] = useState<HealthBadgeState>(() =>
    healthBadgeStateContract.parse({ state: 'checking' }),
  );

  // Doubles as the mount-time seed and the click-driven retry — both are "ask the server once,
  // render whatever comes back", so the effect below calls this same function on mount.
  const retry = useCallback((): void => {
    healthStatusGetBroker()
      .then((nextState) => {
        setBadgeState(nextState);
      })
      .catch((error: unknown) => {
        globalThis.console.error('[use-health-status]', error);
      });
  }, []);

  useEffect(() => {
    retry();

    const subscription = webSocketChannelState.healthStatus$().subscribe((payload) => {
      // healthPayloadToBadgeStateTransformer is the one construction site for the online/degraded
      // shape; the arrival timestamp is stamped separately, then the whole object is re-parsed
      // through healthBadgeStateContract so lastHeartbeatAt comes back branded rather than cast.
      const baseState = healthPayloadToBadgeStateTransformer({ payload, lastHeartbeatAt: null });
      setBadgeState(
        healthBadgeStateContract.parse({
          ...baseState,
          lastHeartbeatAt: new Date().toISOString(),
        }),
      );
    });

    const intervalId = globalThis.setInterval((): void => {
      setBadgeState((current) => {
        const lastHeartbeatAt = 'lastHeartbeatAt' in current ? current.lastHeartbeatAt : undefined;
        const silent = isHeartbeatSilentGuard({ lastHeartbeatAt, now: Date.now() });
        if (!silent) return current;
        return healthBadgeStateContract.parse({
          state: 'offline',
          offlineCause: 'silence',
          lastHeartbeatAt,
        });
      });
    }, healthBadgeStatics.silenceTickMs);

    return (): void => {
      subscription.unsubscribe();
      globalThis.clearInterval(intervalId);
    };
  }, [retry]);

  return { badgeState, retry };
};
