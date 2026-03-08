/**
 * PURPOSE: Checks if the design tab should be visible based on quest status
 *
 * USAGE:
 * isDesignTabVisibleGuard({status: 'explore_design'});
 * // Returns true because design tab is shown during design phases
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';

export const isDesignTabVisibleGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (!status) {
    return false;
  }

  return status === 'explore_design' || status === 'review_design' || status === 'design_approved';
};
