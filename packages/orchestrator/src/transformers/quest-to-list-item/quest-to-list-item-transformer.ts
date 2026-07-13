/**
 * PURPOSE: Transforms a full Quest into a simplified QuestListItem for display
 *
 * USAGE:
 * questToListItemTransformer({quest});
 * // Returns QuestListItem with id, title, status, stepProgress (operations-ledger progress)
 */

import type { Quest, QuestListItem } from '@dungeonmaster/shared/contracts';
import { questListItemContract } from '@dungeonmaster/shared/contracts';

import { questActiveSessionTransformer } from '../quest-active-session/quest-active-session-transformer';

export const questToListItemTransformer = ({ quest }: { quest: Quest }): QuestListItem => {
  const completedOperations = quest.operations.filter(
    (operation) => operation.status === 'complete',
  ).length;
  const totalOperations = quest.operations.length;
  const stepProgress =
    totalOperations > 0 ? `${completedOperations}/${totalOperations}` : undefined;

  const { sessionId } = questActiveSessionTransformer({ workItems: quest.workItems });

  return questListItemContract.parse({
    id: quest.id,
    folder: quest.folder,
    title: quest.title,
    status: quest.status,
    createdAt: quest.createdAt,
    stepProgress,
    activeSessionId: sessionId,
    userRequest: quest.userRequest,
  });
};
