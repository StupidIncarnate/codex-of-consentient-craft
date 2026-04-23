/**
 * PURPOSE: Checks if a quest has reached a smoketest-terminal state — quest.status in
 *   {complete, blocked, abandoned}, OR every workItem has a terminal workItemStatus
 *   (complete, failed, skipped).
 *
 * USAGE:
 * isSmoketestPollTerminalStatusGuard({ quest });
 * // Returns true when the smoketest scenario has reached a stable endpoint — either the
 * // quest transitioned to a terminal status (happy path), or the orchestration loop
 * // drained every work item into a terminal state (failure-routing paths where
 * // quest.status legitimately stays `in_progress` awaiting user intervention but the
 * // scripted scenario has fully played out).
 *
 * WHY: The smoketest runner needs a terminal signal that covers both outcomes. For the
 * happy path the orchestration loop writes `complete` onto quest.status. For cases with
 * any `failed` work items the loop leaves quest.status at `in_progress` (production
 * expects user intervention there), but the scripted smoketest scenario has finished —
 * "every workItem terminal" is the equivalent signal.
 *
 * `isTerminalQuestStatusGuard` in shared treats `blocked` as non-terminal (resumable), but
 * from the smoketest runner's perspective a blocked quest is a stable endpoint — it means
 * the loop finished without completion. The runner must unblock on `blocked` too.
 */

import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import type { QuestStatus, WorkItem } from '@dungeonmaster/shared/contracts';

export const isSmoketestPollTerminalStatusGuard = ({
  status,
  workItems,
}: {
  status?: QuestStatus;
  workItems?: readonly WorkItem[];
}): boolean => {
  if (status === undefined) {
    return false;
  }
  if (status === 'complete' || status === 'blocked' || status === 'abandoned') {
    return true;
  }
  if (workItems === undefined || workItems.length === 0) {
    return false;
  }
  return workItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }));
};
