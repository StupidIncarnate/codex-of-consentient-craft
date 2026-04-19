/**
 * PURPOSE: Checks if a quest status allows abandonment (any non-terminal status)
 *
 * USAGE:
 * isAbandonableQuestStatusGuard({ status: 'in_progress' });
 * // Returns true for any non-terminal status; false for complete/abandoned
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isAbandonableQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isAbandonable;
};
