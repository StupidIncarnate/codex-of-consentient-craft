/**
 * PURPOSE: Answers whether a stopping sub-agent still has a backgrounded command out. Reach for this
 * over subagentStopNeedsBlockGuard when the question is "would ending this turn destroy work in
 * flight": that guard asks whether a work item was left unsignalled, which is a different failure
 * and is scoped to work-item agents alone. This one binds every sub-agent, because a headless
 * session TERMINATES its background tasks the moment its final response lands.
 *
 * USAGE:
 * hasRunningBackgroundTaskGuard({ backgroundTasks });
 * // Returns true when at least one task is still running, so the stop must be refused
 */

import { hookBackgroundTaskStatics } from '../../statics/hook-background-task/hook-background-task-statics';
import type { HookBackgroundTask } from '../../contracts/hook-background-task/hook-background-task-contract';

// `| undefined` is explicit, not redundant: `exactOptionalPropertyTypes` is on, so a caller reading
// an optional field straight off a parsed hook event cannot pass it to a bare `?` parameter.
export const hasRunningBackgroundTaskGuard = ({
  backgroundTasks,
}: {
  backgroundTasks?: HookBackgroundTask[] | undefined;
}): boolean => {
  if (!backgroundTasks) {
    return false;
  }

  // `status` is branded and the static is a plain literal, so the two are not directly comparable;
  // widening the branded value is what keeps this a comparison rather than a cast.
  return backgroundTasks.some(
    (task) => String(task.status) === hookBackgroundTaskStatics.status.running,
  );
};
