/**
 * PURPOSE: React hook that exposes the declared orchestrationMode (claude | node) from `.dungeonmaster.json`.
 * Fetches once from GET /api/orchestration/mode on mount. The value is static config (changes only on a
 * server restart), so there is no WebSocket refetch.
 *
 * USAGE:
 * const { mode, isLoading } = useOrchestrationModeBinding();
 * // mode = OrchestrationMode | null. Null until the first fetch resolves (or on fetch failure).
 */

import { useCallback, useEffect, useState } from 'react';

import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';

import { orchestrationModeGetBroker } from '../../brokers/orchestration/mode-get/orchestration-mode-get-broker';

export const useOrchestrationModeBinding = (): {
  mode: OrchestrationMode | null;
  isLoading: boolean;
} => {
  const [mode, setMode] = useState<OrchestrationMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const next = await orchestrationModeGetBroker();
      setMode(next);
    } catch (error: unknown) {
      globalThis.console.error('[use-orchestration-mode]', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      globalThis.console.error('[use-orchestration-mode]', error);
    });
  }, [refresh]);

  return { mode, isLoading };
};
