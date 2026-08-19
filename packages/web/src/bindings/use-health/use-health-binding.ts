/**
 * PURPOSE: React hook backing the header health badge. Seeds from GET /api/health on mount, then
 * re-fetches on every emission of the shared web socket channel's healthChanged$ observable, and
 * clears the snapshot the moment the channel closes — a stale ONLINE uptime after the server died is
 * exactly what this hook exists to avoid.
 *
 * USAGE:
 * const { snapshot, isLoading, error, refresh } = useHealthBinding();
 * // snapshot = HealthSnapshot | null. Null on the first render, on a failed fetch, an unparseable
 * // body, or a dropped WebSocket connection. refresh() re-runs the same GET on demand (the RETRY
 * // control) without touching isLoading.
 */

import { useCallback, useEffect, useState } from 'react';

import type { ErrorMessage, HealthSnapshot } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { healthGetBroker } from '../../brokers/health/get/health-get-broker';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { healthErrorStatics } from '../../statics/health-error/health-error-statics';

export const useHealthBinding = (): {
  snapshot: HealthSnapshot | null;
  isLoading: boolean;
  error: ErrorMessage | null;
  refresh: () => Promise<void>;
} => {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const reportFailure = useCallback(({ caughtError }: { caughtError: unknown }): void => {
    setSnapshot(null);
    setError(
      errorMessageContract.parse(
        caughtError instanceof Error ? caughtError.message : 'Failed to load health snapshot',
      ),
    );
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const next = await healthGetBroker();
      setSnapshot(next);
      setError(null);
      setIsLoading(false);
    } catch (caughtError: unknown) {
      reportFailure({ caughtError });
    }
  }, [reportFailure]);

  useEffect(() => {
    refresh().catch((caughtError: unknown) => {
      reportFailure({ caughtError });
    });

    const healthSubscription = webSocketChannelState.healthChanged$().subscribe(() => {
      refresh().catch((caughtError: unknown) => {
        reportFailure({ caughtError });
      });
    });

    const closeSubscription = webSocketChannelState.closes$().subscribe(() => {
      setSnapshot(null);
      setError(errorMessageContract.parse(healthErrorStatics.socketClosedMessage));
    });

    return (): void => {
      healthSubscription.unsubscribe();
      closeSubscription.unsubscribe();
    };
  }, [refresh, reportFailure]);

  return { snapshot, isLoading, error, refresh };
};
