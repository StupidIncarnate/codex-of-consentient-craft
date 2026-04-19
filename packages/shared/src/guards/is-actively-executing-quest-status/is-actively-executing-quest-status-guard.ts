/**
 * PURPOSE: Returns true iff status is exactly in_progress — the quest is actively executing code changes
 *
 * USAGE:
 * isActivelyExecutingQuestStatusGuard({ status: 'in_progress' });
 * // Returns true only for the locked in_progress status
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isActivelyExecutingQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isActivelyExecuting;
};
