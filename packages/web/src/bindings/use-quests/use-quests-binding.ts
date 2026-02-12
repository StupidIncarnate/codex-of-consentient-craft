/**
 * PURPOSE: React hook that fetches the list of all quests with loading, error, and refresh support
 *
 * USAGE:
 * const {data, loading, error, refresh} = useQuestsBinding();
 * // Returns {data: QuestListItem[], loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { QuestListItem } from '@dungeonmaster/shared/contracts';

import { questListBroker } from '../../brokers/quest/list/quest-list-broker';

export const useQuestsBinding = (): {
  data: QuestListItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<QuestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuests = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const quests = await questListBroker();
      setData(quests);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuests().catch(() => undefined);
  }, [fetchQuests]);

  return { data, loading, error, refresh: fetchQuests };
};
