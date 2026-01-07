/**
 * PURPOSE: Validates that a quest has sufficient data for PathSeeker processing
 *
 * USAGE:
 * isQuestReadyForPathseekerGuard({quest});
 * // Returns true if quest has observables, tasks, and task-observable links
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

export const isQuestReadyForPathseekerGuard = ({ quest }: { quest?: Quest }): boolean => {
  if (!quest) {
    return false;
  }

  // Check quest has observables[] with length > 0
  if (quest.observables.length === 0) {
    return false;
  }

  // Check quest has tasks[] with length > 0
  if (quest.tasks.length === 0) {
    return false;
  }

  // Check each task has at least one observableId
  const allTasksHaveObservables = quest.tasks.every((task) => task.observableIds.length > 0);

  return allTasksHaveObservables;
};
