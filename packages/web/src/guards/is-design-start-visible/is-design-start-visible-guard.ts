/**
 * PURPOSE: Checks if the START DESIGN button should be visible based on quest status and needsDesign flag
 *
 * USAGE:
 * isDesignStartVisibleGuard({quest: questData});
 * // Returns true when quest is approved and needs design prototyping
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

export const isDesignStartVisibleGuard = ({
  quest,
}: {
  quest?: Pick<Quest, 'status' | 'needsDesign'>;
}): boolean => {
  if (!quest) {
    return false;
  }

  return quest.status === 'approved' && quest.needsDesign;
};
