/**
 * PURPOSE: React hook that fetches all quests and manages loading/error states
 *
 * USAGE:
 * const {data, loading, error} = useQuestsListBinding({projectId});
 * // Returns {data: QuestListItem[], loading: boolean, error: Error | null}
 */
import React from 'react';

import type { ProjectId, QuestListItem } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from '../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';

export const useQuestsListBinding = ({
  projectId,
}: {
  projectId: ProjectId;
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

    orchestratorListQuestsAdapter({ projectId })
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
  }, [projectId]);

  return { data, loading, error };
};
