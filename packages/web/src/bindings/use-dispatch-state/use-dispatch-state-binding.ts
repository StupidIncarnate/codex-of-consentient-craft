/**
 * PURPOSE: React hook that exposes the Node dispatcher play/pause state. Seeds from GET /api/orchestration/dispatch on mount, then re-fetches on every emission of the shared web socket channel's dispatchStateChanged$ observable.
 *
 * USAGE:
 * const { state, isLoading } = useDispatchStateBinding();
 * // state = DispatchState | null. Null until the first fetch resolves.
 */

import { useCallback, useEffect, useState } from 'react';

import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchGetBroker } from '../../brokers/orchestration/dispatch-get/orchestration-dispatch-get-broker';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';

export const useDispatchStateBinding = (): {
  state: DispatchState | null;
  isLoading: boolean;
} => {
  const [state, setState] = useState<DispatchState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const next = await orchestrationDispatchGetBroker();
      setState(next);
    } catch (error: unknown) {
      globalThis.console.error('[use-dispatch-state]', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      globalThis.console.error('[use-dispatch-state]', error);
    });

    const subscription = webSocketChannelState.dispatchStateChanged$().subscribe(() => {
      refresh().catch((error: unknown) => {
        globalThis.console.error('[use-dispatch-state]', error);
      });
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { state, isLoading };
};
