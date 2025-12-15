/**
 * PURPOSE: Calculates task progress as a string like "2/5"
 *
 * USAGE:
 * calculateTaskProgressTransformer({tasks: [...]});
 * // Returns '2/5' showing completed tasks out of total
 */

import { taskProgressContract } from '@dungeonmaster/shared/contracts';
import type { TaskProgress, QuestTask } from '@dungeonmaster/shared/contracts';

export const calculateTaskProgressTransformer = ({
  tasks,
}: {
  tasks: QuestTask[];
}): TaskProgress => {
  const completedTasks = tasks.filter((task) => task.status === 'complete').length;
  const totalTasks = tasks.length;

  const progress = totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0';

  return taskProgressContract.parse(progress);
};
