/**
 * PURPOSE: React hook that fetches all quests and manages loading/error states
 *
 * USAGE:
 * const {data, loading, error} = useQuestsListBinding({startPath});
 * // Returns {data: QuestListItem[], loading: boolean, error: Error | null}
 */
import React from 'react';

import type { FilePath, QuestListItem } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from '../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';

export const useQuestsListBinding = ({
  startPath,
}: {
  startPath: FilePath;
}): {
  data: QuestListItem[];
  loading: boolean;
  error: Error | null;
} => {
  const [data, setData] = React.useState<QuestListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    orchestratorListQuestsAdapter({ startPath })
      .then((quests) => {
        if (isMounted) {
          // Sort by createdAt descending (newest first)
          const sorted = [...quests].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
          setData(sorted);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [startPath]);

  return { data, loading, error };
};
