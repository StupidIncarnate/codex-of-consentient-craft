/**
 * PURPOSE: React hook that fetches the list of quests for a guild, the quest files that could not be read, plus loading, error, and refresh support
 *
 * USAGE:
 * const {data, skipped, loading, error, refresh} = useQuestsBinding({guildId});
 * // Returns {data: QuestListItem[], skipped: SkippedQuestFile[], loading: boolean, error: Error | null, refresh: () => Promise<void>}
 *
 * `skipped` is its own field rather than an `error`: the request succeeds with a 200, so `error`
 * never fires for a dropped quest file. A consumer renders the list and the omission together.
 */
import { useCallback, useEffect, useState } from 'react';

import type { GuildId, QuestListItem, SkippedQuestFile } from '@dungeonmaster/shared/contracts';

import { questListBroker } from '../../brokers/quest/list/quest-list-broker';

export const useQuestsBinding = ({
  guildId,
}: {
  guildId: GuildId | null;
}): {
  data: QuestListItem[];
  skipped: SkippedQuestFile[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<QuestListItem[]>([]);
  const [skipped, setSkipped] = useState<SkippedQuestFile[]>([]);
  const [loading, setLoading] = useState(guildId !== null);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuests = useCallback(async (): Promise<void> => {
    if (guildId === null) {
      setData([]);
      setSkipped([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await questListBroker({ guildId });
      setData(result.quests);
      setSkipped(result.skipped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchQuests().catch((catchError: unknown) => {
      globalThis.console.error('[use-quests]', catchError);
    });
  }, [fetchQuests]);

  return { data, skipped, loading, error, refresh: fetchQuests };
};
