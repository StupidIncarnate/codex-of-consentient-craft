/**
 * PURPOSE: React hook that exposes one quest's projected execution remainder. Seeds from
 * GET /api/quests/:questId/projection on mount, then re-fetches on every `quest-modified` broadcast
 * for THAT quest (the shared web socket channel's questUpdated$ observable, filtered on the quest id).
 *
 * USAGE:
 * const { data, loading, error } = useQuestProjectionBinding({ questId });
 * // data = QuestProjection | null, loading = true until the first fetch settles
 *
 * IT REFETCHES RATHER THAN WALKING THE STEP GRAPH ITSELF. `quest-modified` carries the whole quest,
 * but the projection is COMPUTED from that quest's scopes and work items by
 * `questProjectionBuildTransformer`, not stored on it — re-deriving the walk in the browser would be a
 * second implementation of `agentFlowStatics` traversal that can drift from the orchestrator's own
 * router. The broadcast is the trigger; the endpoint is the answer, exactly as
 * `useQuestSummaryBinding` does for the verification summary.
 */

import { useCallback, useEffect, useState } from 'react';

import type { QuestId, QuestProjection } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapter } from '../../adapters/rxjs/filter/rxjs-filter-adapter';
import { questProjectionBroker } from '../../brokers/quest/projection/quest-projection-broker';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';

export const useQuestProjectionBinding = ({
  questId,
}: {
  questId: QuestId | null;
}): {
  data: QuestProjection | null;
  loading: boolean;
  error: Error | null;
} => {
  const [data, setData] = useState<QuestProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (questId === null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const projection = await questProjectionBroker({ questId });
      setData(projection);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    refresh().catch((catchError: unknown) => {
      globalThis.console.error('[use-quest-projection]', catchError);
    });

    // Filtered on the quest id: one browser tab holds one shared socket, and a `quest-modified` for
    // a quest this panel is not showing must not spend a request.
    const subscription = rxjsFilterAdapter({
      source: webSocketChannelState.questUpdated$(),
      predicate: (quest) => quest.id === questId,
    }).subscribe((): void => {
      refresh().catch((catchError: unknown) => {
        globalThis.console.error('[use-quest-projection]', catchError);
      });
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [refresh, questId]);

  return { data, loading, error };
};
