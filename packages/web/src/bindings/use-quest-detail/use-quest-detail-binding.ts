/**
 * PURPOSE: React hook that fetches a single quest by ID with loading, error, and refresh support
 *
 * USAGE:
 * const {data, loading, error, refresh} = useQuestDetailBinding({questId});
 * // Returns {data: Quest | null, loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { questDetailBroker } from '../../brokers/quest/detail/quest-detail-broker';

export const useQuestDetailBinding = ({
  questId,
}: {
  questId: QuestId | null;
}): {
  data: Quest | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuest = useCallback(async (): Promise<void> => {
    if (!questId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quest = await questDetailBroker({ questId });
      setData(quest);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    fetchQuest().catch(() => undefined);
  }, [fetchQuest]);

  return { data, loading, error, refresh: fetchQuest };
};
