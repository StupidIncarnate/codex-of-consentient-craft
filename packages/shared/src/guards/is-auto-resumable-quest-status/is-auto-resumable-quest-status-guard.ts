/**
 * PURPOSE: Checks if a quest status should auto-resume the orchestration loop after a modify
 *
 * USAGE:
 * isAutoResumableQuestStatusGuard({ status: 'in_progress' });
 * // Returns true only for in_progress
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isAutoResumableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isAutoResumable;
};
