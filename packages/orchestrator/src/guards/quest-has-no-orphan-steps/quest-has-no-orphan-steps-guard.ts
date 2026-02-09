/**
 * PURPOSE: Validates that every step satisfies at least one observable via its observablesSatisfied array
 *
 * USAGE:
 * questHasNoOrphanStepsGuard({steps});
 * // Returns true if every step has non-empty observablesSatisfied, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questHasNoOrphanStepsGuard = ({ steps }: { steps?: DependencyStep[] }): boolean => {
  if (!steps) {
    return false;
  }

  if (steps.length === 0) {
    return true;
  }

  return steps.every((step) => step.observablesSatisfied.length > 0);
};
