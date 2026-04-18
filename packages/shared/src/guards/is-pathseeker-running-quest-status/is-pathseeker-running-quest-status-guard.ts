/**
 * PURPOSE: Checks if a quest status indicates PathSeeker is actively running (seek_* statuses)
 *
 * USAGE:
 * isPathseekerRunningQuestStatusGuard({ status: 'seek_scope' });
 * // Returns true when the status is one of the seek_* planning phases
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isPathseekerRunningQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isPathseekerRunning;
};
