/**
 * PURPOSE: Checks if a quest status indicates the quest was actively executing and needs recovery on server restart
 *
 * USAGE:
 * isRecoverableQuestStatusGuard({ status: 'in_progress' });
 * // Returns true for statuses that indicate interrupted execution
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';

const RECOVERABLE_STATUSES: ReadonlySet<QuestStatus> = new Set<QuestStatus>([
  'in_progress',
  'blocked',
]);

export const isRecoverableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return RECOVERABLE_STATUSES.has(status);
};
