/**
 * PURPOSE: Checks if a quest status allows starting execution (approved + design_approved)
 *
 * USAGE:
 * isStartableQuestStatusGuard({ status: 'approved' });
 * // Returns true for statuses where a Start Quest action applies
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isStartableQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isStartable;
};
