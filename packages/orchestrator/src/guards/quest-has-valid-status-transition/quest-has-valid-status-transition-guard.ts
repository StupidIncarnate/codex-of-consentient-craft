/**
 * PURPOSE: Validates that a quest status transition is allowed by the lifecycle state machine
 *
 * USAGE:
 * questHasValidStatusTransitionGuard({ currentStatus: 'created', nextStatus: 'flows_approved' });
 * // Returns: true
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';

import { questStatusTransitionsStatics } from '../../statics/quest-status-transitions/quest-status-transitions-statics';

export const questHasValidStatusTransitionGuard = ({
  currentStatus,
  nextStatus,
}: {
  currentStatus?: QuestStatus;
  nextStatus?: QuestStatus;
}): boolean => {
  if (!currentStatus || !nextStatus) {
    return false;
  }

  const allowedTransitions = questStatusTransitionsStatics[currentStatus];

  return (allowedTransitions as readonly QuestStatus[]).includes(nextStatus);
};
