/**
 * PURPOSE: Checks if a quest status indicates a recoverable quest that should be auto-resumed on server restart
 *
 * USAGE:
 * isRecoverableQuestStatusGuard({ status: 'seek_plan' });
 * // Returns true for non-terminal non-paused active statuses
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isRecoverableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isRecoverable;
};
