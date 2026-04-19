/**
 * PURPOSE: Checks if a quest status indicates the quest can be resumed (paused or blocked)
 *
 * USAGE:
 * isQuestResumableQuestStatusGuard({ status: 'paused' });
 * // Returns true for statuses where a Resume action applies
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isQuestResumableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isResumable;
};
