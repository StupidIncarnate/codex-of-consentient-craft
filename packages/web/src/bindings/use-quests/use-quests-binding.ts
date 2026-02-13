/**
 * PURPOSE: React hook that fetches the list of quests for a project with loading, error, and refresh support
 *
 * USAGE:
 * const {data, loading, error, refresh} = useQuestsBinding({projectId});
 * // Returns {data: QuestListItem[], loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { ProjectId, QuestListItem } from '@dungeonmaster/shared/contracts';

import { questListBroker } from '../../brokers/quest/list/quest-list-broker';

export const useQuestsBinding = ({
  projectId,
}: {
  projectId: ProjectId | null;
}): {
  data: QuestListItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<QuestListItem[]>([]);
  const [loading, setLoading] = useState(projectId !== null);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuests = useCallback(async (): Promise<void> => {
    if (projectId === null) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quests = await questListBroker({ projectId });
      setData(quests);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchQuests().catch(() => undefined);
  }, [fetchQuests]);

  return { data, loading, error, refresh: fetchQuests };
};
