/**
 * PURPOSE: Checks if a quest status represents an active execution phase
 *
 * USAGE:
 * isExecutionPhaseGuard({status: 'in_progress'});
 * // Returns true for statuses where the quest is being executed
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';

export const isExecutionPhaseGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (!status) {
    return false;
  }

  return (
    status === 'seek_scope' ||
    status === 'seek_synth' ||
    status === 'seek_walk' ||
    status === 'seek_plan' ||
    status === 'in_progress' ||
    status === 'paused' ||
    status === 'blocked' ||
    status === 'complete' ||
    status === 'abandoned'
  );
};
