/**
 * PURPOSE: Transforms a full Quest into a simplified QuestListItem for display
 *
 * USAGE:
 * questToListItemTransformer({quest});
 * // Returns QuestListItem with id, title, status, stepProgress
 */

import type { Quest, QuestListItem } from '@dungeonmaster/shared/contracts';
import { questListItemContract } from '@dungeonmaster/shared/contracts';

import { questActiveSessionTransformer } from '../quest-active-session/quest-active-session-transformer';

export const questToListItemTransformer = ({ quest }: { quest: Quest }): QuestListItem => {
  const completedSteps = quest.steps.filter((step) => step.status === 'complete').length;
  const totalSteps = quest.steps.length;
  const stepProgress = totalSteps > 0 ? `${completedSteps}/${totalSteps}` : undefined;

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
