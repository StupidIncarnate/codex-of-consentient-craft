/**
 * PURPOSE: Returns the next approval-target status for a quest, or null if no approval is pending
 *
 * USAGE:
 * nextApprovalQuestStatusTransformer({ status: 'review_flows' });
 * // Returns 'flows_approved' — the status the user would approve to next
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const nextApprovalQuestStatusTransformer = ({
  status,
}: {
  status: QuestStatus;
}): QuestStatus | null => questStatusMetadataStatics.statuses[status].nextApprovalStatus;
