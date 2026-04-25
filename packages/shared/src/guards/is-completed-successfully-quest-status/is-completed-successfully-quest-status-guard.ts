/**
 * PURPOSE: Returns true iff status is the successful terminal status (complete) — distinguishes successful completion from failure-style terminals (abandoned)
 *
 * USAGE:
 * isCompletedSuccessfullyQuestStatusGuard({ status: 'complete' });
 * // Returns true only for the complete status
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isCompletedSuccessfullyQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isCompletedSuccessfully;
};
