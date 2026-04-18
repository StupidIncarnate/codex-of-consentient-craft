/**
 * PURPOSE: Checks if a quest status is in the design phase (explore_design, review_design, design_approved)
 *
 * USAGE:
 * isDesignPhaseQuestStatusGuard({ status: 'review_design' });
 * // Returns true for design-phase statuses
 */

import type { QuestStatus } from '../../contracts/quest-status/quest-status-contract';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

export const isDesignPhaseQuestStatusGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return questStatusMetadataStatics.statuses[status].isDesignPhase;
};
