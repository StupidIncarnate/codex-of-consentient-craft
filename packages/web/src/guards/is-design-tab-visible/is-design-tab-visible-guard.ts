/**
 * PURPOSE: Checks if the design tab should be visible based on quest status
 *
 * USAGE:
 * isDesignTabVisibleGuard({status: 'explore_design'});
 * // Returns true because design tab is shown during design phases
 */

import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { isDesignPhaseQuestStatusGuard } from '@dungeonmaster/shared/guards';

export const isDesignTabVisibleGuard = ({ status }: { status?: QuestStatus }): boolean => {
  if (status === undefined) {
    return false;
  }
  return isDesignPhaseQuestStatusGuard({ status });
};
