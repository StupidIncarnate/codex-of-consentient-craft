/**
 * PURPOSE: Checks if a quest status represents a gate-approved state (flows_approved, approved, design_approved)
 *
 * USAGE:
 * isGateApprovedQuestStatusGuard({ status: 'approved' });
 * // Returns true for *_approved statuses
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isGateApprovedQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isGateApproved;
};
