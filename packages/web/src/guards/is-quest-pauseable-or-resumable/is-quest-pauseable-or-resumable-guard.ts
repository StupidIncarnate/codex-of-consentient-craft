/**
 * PURPOSE: Checks if a quest status is one where pause or resume buttons apply
 *
 * USAGE:
 * isQuestPauseableOrResumableGuard({status: 'in_progress'});
 * // Returns true for statuses where the quest can be paused (seek_*, in_progress)
 * // or resumed (paused). Returns false for pre-execution spec states, blocked,
 * // complete, and abandoned.
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';

export const isQuestPauseableOrResumableGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (!status) {
    return false;
  }

  return (
    status === 'seek_scope' ||
    status === 'seek_synth' ||
    status === 'seek_walk' ||
    status === 'seek_plan' ||
    status === 'in_progress' ||
    status === 'paused'
  );
};
