/**
 * PURPOSE: Checks if a quest status indicates the quest is blocked (blocked)
 *
 * USAGE:
 * isQuestBlockedQuestStatusGuard({ status: 'blocked' });
 * // Returns true only for the blocked status
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isQuestBlockedQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isQuestBlocked;
};
