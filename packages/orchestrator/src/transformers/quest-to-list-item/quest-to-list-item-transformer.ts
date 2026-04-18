/**
 * PURPOSE: Transforms a full Quest into a simplified QuestListItem for display
 *
 * USAGE:
 * questToListItemTransformer({quest});
 * // Returns QuestListItem with id, title, status, stepProgress
 */

import type { Quest, QuestListItem } from '@dungeonmaster/shared/contracts';
import { questListItemContract } from '@dungeonmaster/shared/contracts';
import { isCompleteWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { questActiveSessionTransformer } from '../quest-active-session/quest-active-session-transformer';

export const questToListItemTransformer = ({ quest }: { quest: Quest }): QuestListItem => {
  const stepWorkItems = quest.workItems.filter(
    (wi) => wi.role === 'codeweaver' && wi.relatedDataItems.some((ref) => ref.startsWith('steps/')),
  );
  const completedSteps = stepWorkItems.filter((wi) =>
    isCompleteWorkItemStatusGuard({ status: wi.status }),
  ).length;
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
