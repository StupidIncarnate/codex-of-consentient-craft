/**
 * PURPOSE: Validates that a quest has sufficient data for PathSeeker processing
 *
 * USAGE:
 * isQuestReadyForPathseekerGuard({quest});
 * // Returns true if quest has observables (created by ChaosWhisperer)
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

export const isQuestReadyForPathseekerGuard = ({ quest }: { quest?: Quest }): boolean => {
  if (!quest) {
    return false;
  }

  // Check quest has observables[] with length > 0 (created by ChaosWhisperer)
  return quest.observables.length > 0;
};
