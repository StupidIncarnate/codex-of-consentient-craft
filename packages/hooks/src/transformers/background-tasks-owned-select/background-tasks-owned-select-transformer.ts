/**
 * PURPOSE: Narrows a stop event's `background_tasks` to the entries the STOPPING agent started
 * itself, by asking whether that agent's own transcript mentions each task's id. Reach for this
 * before `hasRunningBackgroundTaskGuard` on any event that can carry somebody else's work: the
 * array is SESSION-wide and carries no owner field, so a sibling's lane, a parent's dev server and
 * a grandparent's watcher all arrive in it looking exactly like the agent's own command.
 *
 * The id is the ownership key because the harness prints it into the starting agent's own
 * transcript and nowhere else — measured across three probes, a shell id appeared in its owner's
 * transcript and in no sibling's, no child's and no parent's. Matching on the id rather than on the
 * sentence around it survives a wording change in the harness's Bash result text.
 *
 * USAGE:
 * backgroundTasksOwnedSelectTransformer({ backgroundTasks, transcript });
 * // Returns: the subset of entries this transcript started
 */

import type { HookBackgroundTask } from '../../contracts/hook-background-task/hook-background-task-contract';

export const backgroundTasksOwnedSelectTransformer = ({
  backgroundTasks,
  transcript,
}: {
  backgroundTasks: HookBackgroundTask[];
  transcript: string;
}): HookBackgroundTask[] => backgroundTasks.filter((task) => transcript.includes(String(task.id)));
