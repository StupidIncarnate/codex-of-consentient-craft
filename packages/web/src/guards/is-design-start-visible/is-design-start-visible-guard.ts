/**
 * PURPOSE: Checks if the START DESIGN button should be visible based on quest status and needsDesign flag
 *
 * USAGE:
 * isDesignStartVisibleGuard({quest: questData});
 * // Returns true when quest is in a startable status (approved or design_approved) and needs design prototyping
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isStartableQuestStatusGuard } from '@dungeonmaster/shared/guards';

export const isDesignStartVisibleGuard = ({
  quest,
}: {
  quest?: Pick<Quest, 'status' | 'needsDesign'>;
}): boolean => {
  if (!quest) {
    return false;
  }

  return isStartableQuestStatusGuard({ status: quest.status }) && quest.needsDesign;
};
