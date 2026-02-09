/**
 * PURPOSE: Validates that every step's dependsOn IDs reference existing steps
 *
 * USAGE:
 * questHasDependencyIntegrityGuard({steps});
 * // Returns true if all dependsOn references point to existing step IDs, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questHasDependencyIntegrityGuard = ({
  steps,
}: {
  steps?: DependencyStep[];
}): boolean => {
  if (!steps) {
    return false;
  }

  const stepIds = new Set(steps.map((step) => step.id));

  return steps.every((step) => step.dependsOn.every((depId) => stepIds.has(depId)));
};
