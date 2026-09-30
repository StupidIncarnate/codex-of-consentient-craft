/**
 * PURPOSE: React hook that exposes one quest's verification summary. Seeds from
 * GET /api/quests/:questId/summary on mount, then re-fetches on every `quest-modified` broadcast for
 * THAT quest (the shared web socket channel's questUpdated$ observable, filtered on the quest id).
 *
 * USAGE:
 * const { data, loading, error } = useQuestSummaryBinding({ questId });
 * // data = QuestSummary | null, loading = true until the first fetch settles
 *
 * IT REFETCHES RATHER THAN READING THE BROADCAST QUEST. `quest-modified` carries the whole quest,
 * but the summary is COMPUTED from that quest's flow graph by the orchestrator, not stored on it —
 * deriving it in the browser would be a second implementation of the per-track eligibility rules that
 * can drift from the orchestrator's own. The broadcast is the trigger; the endpoint is the
 * answer. That chain is what makes a sign-off write repaint the panel: `questPersistBroker` appends to
 * the file outbox, the server's outbox watcher loads the quest and sends `quest-modified` to every
 * client SUBSCRIBED TO THAT QUEST, and `webSocketChannelState` routes it to `questUpdated$`.
 */

import { useQuestSummaryResultContract } from '../../contracts/use-quest-summary-result/use-quest-summary-result-contract';
import type { UseQuestSummaryResult } from '../../contracts/use-quest-summary-result/use-quest-summary-result-contract';
import { useCallback, useEffect, useState } from '#gateway/npm/react';

import { console } from '#gateway/browser/console';

import type { QuestSummary, Quest } from '@dungeonmaster/shared/contracts';

import { filter } from '#gateway/npm/rxjs__operators';
import { questSummaryBroker } from '../../brokers/quest/summary/quest-summary-broker';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';

export const useQuestSummaryBinding = ({
  questId,
}: {
  questId: Quest['id'] | null;
}): UseQuestSummaryResult => {
  const [data, setData] = useState<QuestSummary | null>(null);
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
      const summary = await questSummaryBroker({ questId });
      setData(summary);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    refresh().catch((catchError: unknown) => {
      console.error('[use-quest-summary]', catchError);
    });

    // Filtered on the quest id: one browser tab holds one shared socket, and a `quest-modified` for
    // a quest this panel is not showing must not spend a request.
    const subscription = webSocketChannelState
      .questUpdated$()
      .pipe(filter((quest) => quest.id === questId))
      .subscribe((): void => {
        refresh().catch((catchError: unknown) => {
          console.error('[use-quest-summary]', catchError);
        });
      });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [refresh, questId]);

  return useQuestSummaryResultContract.parse({ data, loading, error });
};
