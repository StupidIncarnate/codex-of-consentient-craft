/**
 * PURPOSE: Answers whether a list of background tasks still holds a live command. Reach for this
 * over subagentStopNeedsBlockGuard when the question is "would ending this turn destroy work in
 * flight": that guard asks whether a work item was left unsignalled, which is a different failure
 * and is scoped to work-item agents alone. This one binds every sub-agent, because a headless
 * session TERMINATES its background tasks the moment its final response lands.
 *
 * It answers over WHATEVER LIST IT IS HANDED and decides no ownership of its own. A raw
 * `background_tasks` array is session-wide, so pass it through
 * backgroundTasksOwnedSelectTransformer first — otherwise this returns true for a sibling's lane
 * and refuses a stop the agent has no way to earn.
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

  // BOTH halves are required, and `type` is the half that matters most. An event lists the stopping
  // agent itself as a `subagent` task whose id is the event's own `agent_id`, so matching on
  // `status` alone blocks every async-dispatched sub-agent on an entry nothing can clear. A missing
  // `type` does NOT match: an unrecognised entry failing open costs a lost command, and failing
  // closed costs a wedged session, which is the worse of the two.
  //
  // The fields are branded and the statics are plain literals, so the two are not directly
  // comparable; widening the branded value keeps each of these a comparison rather than a cast.
  return backgroundTasks.some(
    (task) =>
      String(task.type) === hookBackgroundTaskStatics.type.shell &&
      String(task.status) === hookBackgroundTaskStatics.status.running,
  );
};
