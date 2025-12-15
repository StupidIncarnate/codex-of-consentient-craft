/**
 * PURPOSE: Transforms a full Quest into a simplified QuestListItem for display
 *
 * USAGE:
 * questToListItemTransformer({quest});
 * // Returns QuestListItem with id, title, status, currentPhase, taskProgress
 */

import type { Quest, QuestListItem } from '@dungeonmaster/shared/contracts';
import { questListItemContract } from '@dungeonmaster/shared/contracts';
import { calculateTaskProgressTransformer } from '../calculate-task-progress/calculate-task-progress-transformer';
import { getCurrentPhaseTransformer } from '../get-current-phase/get-current-phase-transformer';

export const questToListItemTransformer = ({ quest }: { quest: Quest }): QuestListItem => {
  const currentPhase = getCurrentPhaseTransformer({ phases: quest.phases });
  const taskProgress = calculateTaskProgressTransformer({ tasks: quest.tasks });

  return questListItemContract.parse({
    id: quest.id,
    folder: quest.folder,
    title: quest.title,
    status: quest.status,
    createdAt: quest.createdAt,
    currentPhase,
    taskProgress,
  });
};
