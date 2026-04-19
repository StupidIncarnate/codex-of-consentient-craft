/**
 * PURPOSE: Checks if a quest status indicates the quest can be paused (seek_* + in_progress)
 *
 * USAGE:
 * isQuestPauseableQuestStatusGuard({ status: 'in_progress' });
 * // Returns true for statuses where a Pause action applies
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isQuestPauseableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isPauseable;
};
