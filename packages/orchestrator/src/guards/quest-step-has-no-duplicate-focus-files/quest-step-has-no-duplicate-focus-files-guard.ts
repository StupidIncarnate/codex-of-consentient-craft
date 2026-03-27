/**
 * PURPOSE: Validates that no two steps share the same focusFile.path
 *
 * USAGE:
 * questStepHasNoDuplicateFocusFilesGuard({steps});
 * // Returns true if all focusFile.path values are unique, false if any are duplicated
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepHasNoDuplicateFocusFilesGuard = ({
  steps,
}: {
  steps?: DependencyStep[];
}): boolean => {
  if (!steps) {
    return false;
  }

  const paths = steps.map((step) => String(step.focusFile.path));
  const uniquePaths = new Set(paths);

  return uniquePaths.size === paths.length;
};
