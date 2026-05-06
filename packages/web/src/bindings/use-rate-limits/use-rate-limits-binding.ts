/**
 * PURPOSE: React hook that exposes the latest 5h/7d rate-limits snapshot. Seeds from GET /api/rate-limits on mount, then re-fetches on rate-limits-updated WebSocket events.
 *
 * USAGE:
 * const { snapshot, isLoading } = useRateLimitsBinding();
 * // snapshot = RateLimitsSnapshot | null. Null until first read or when statusline-tap hasn't run yet.
 */

import { useCallback, useEffect, useState } from 'react';

import { wsMessageContract } from '@dungeonmaster/shared/contracts';
import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { rateLimitsGetBroker } from '../../brokers/rate-limits/get/rate-limits-get-broker';

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

    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;
        if (parsed.data.type !== 'rate-limits-updated') return;
        refresh().catch((error: unknown) => {
          globalThis.console.error('[use-rate-limits]', error);
        });
      },
    });

    return (): void => {
      connection.close();
    };
  }, [refresh]);

  return { snapshot, isLoading };
};
