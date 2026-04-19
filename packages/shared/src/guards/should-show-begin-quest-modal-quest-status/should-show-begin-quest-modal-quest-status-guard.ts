/**
 * PURPOSE: Returns true iff status is exactly 'approved' — the Begin Quest modal must only appear after the spec/observables gate (Gate #2)
 *
 * USAGE:
 * shouldShowBeginQuestModalQuestStatusGuard({ status: 'approved' });
 * // Returns true only for the 'approved' status; false for every other status (including flows_approved, design_approved, explore_observables, etc.)
 *
 * WHEN-TO-USE: UI trigger for the "Shall we go dumpster diving for some code?" modal rendered by QuestApprovedModalWidget.
 * WHEN-NOT-TO-USE: For deciding whether a quest can be started — use isStartableQuestStatusGuard. For deciding whether any gate has been approved — use isGateApprovedQuestStatusGuard.
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';

export const shouldShowBeginQuestModalQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return status === 'approved';
};
