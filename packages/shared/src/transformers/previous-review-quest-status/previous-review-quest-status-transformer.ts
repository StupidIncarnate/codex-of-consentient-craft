/**
 * PURPOSE: Returns the review-gate status that preceded a gate-approved quest status, or null if the status has no prior review gate
 *
 * USAGE:
 * previousReviewQuestStatusTransformer({ status: 'approved' });
 * // Returns 'review_observables' — the review status that would be re-entered to keep chatting
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const previousReviewQuestStatusTransformer = ({
  status,
}: {
  status: QuestStatus;
}): QuestStatus | null => questStatusMetadataStatics.statuses[status].previousReviewStatus;
