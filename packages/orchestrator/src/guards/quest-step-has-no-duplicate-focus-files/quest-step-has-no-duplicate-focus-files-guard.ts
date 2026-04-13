/**
 * PURPOSE: Validates that no two steps share the same focusFile.path
 *
 * USAGE:
 * questStepHasNoDuplicateFocusFilesGuard({steps});
 * // Returns true if all focusFile.path values are unique, false if any are duplicated
 */
import type { DependencyStep } from '@dungeonmaster/shared/contracts';

import { fileAnchoredStepsTransformer } from '../../transformers/file-anchored-steps/file-anchored-steps-transformer';

export const questStepHasNoDuplicateFocusFilesGuard = ({
  steps,
}: {
  steps?: DependencyStep[];
}): boolean => {
  if (!steps) {
    return false;
  }

  const fileSteps = fileAnchoredStepsTransformer({ steps });
  const paths = fileSteps.map((step) => String(step.focusFile.path));
  const uniquePaths = new Set(paths);

  return uniquePaths.size === paths.length;
};
