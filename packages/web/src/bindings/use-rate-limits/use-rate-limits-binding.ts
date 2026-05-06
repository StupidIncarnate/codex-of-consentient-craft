/**
 * PURPOSE: React hook that exposes the latest 5h/7d rate-limits snapshot. Seeds from GET /api/rate-limits on mount, then re-fetches on every emission of the shared web socket channel's rateLimitsChanged$ observable.
 *
 * USAGE:
 * const { snapshot, isLoading } = useRateLimitsBinding();
 * // snapshot = RateLimitsSnapshot | null. Null until first read or when statusline-tap hasn't run yet.
 */

import { useCallback, useEffect, useState } from 'react';

import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { rateLimitsGetBroker } from '../../brokers/rate-limits/get/rate-limits-get-broker';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';

export const useRateLimitsBinding = (): {
  snapshot: RateLimitsSnapshot | null;
  isLoading: boolean;
} => {
  const [snapshot, setSnapshot] = useState<RateLimitsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const next = await rateLimitsGetBroker();
      setSnapshot(next);
    } catch (error: unknown) {
      globalThis.console.error('[use-rate-limits]', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      globalThis.console.error('[use-rate-limits]', error);
    });

    const subscription = webSocketChannelState.rateLimitsChanged$().subscribe(() => {
      refresh().catch((error: unknown) => {
        globalThis.console.error('[use-rate-limits]', error);
      });
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { snapshot, isLoading };
};
