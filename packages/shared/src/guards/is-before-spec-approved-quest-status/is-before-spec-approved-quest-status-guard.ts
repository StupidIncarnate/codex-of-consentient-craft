/**
 * PURPOSE: Checks if a quest status precedes `approved` on the spec-review track (created through review_observables)
 *
 * USAGE:
 * isBeforeSpecApprovedQuestStatusGuard({ status: 'review_flows' });
 * // Returns true for statuses that precede spec approval, false once the quest reaches approved or later
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isBeforeSpecApprovedQuestStatusGuard = ({
  status,
}: {
  status?: QuestStatus;
}): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isBeforeSpecApproved;
};
