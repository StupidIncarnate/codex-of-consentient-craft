/**
 * PURPOSE: Checks if a quest status indicates the user has paused the quest (paused)
 *
 * USAGE:
 * isUserPausedQuestStatusGuard({ status: 'paused' });
 * // Returns true only for the paused status
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isUserPausedQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isUserPaused;
};
