/**
 * PURPOSE: Validates that every step has at least one assertion
 *
 * USAGE:
 * questStepHasValidAssertionsGuard({steps});
 * // Returns true if all steps have at least one assertion, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepHasValidAssertionsGuard = ({
  steps,
}: {
  steps?: DependencyStep[];
}): boolean => {
  if (!steps) {
    return false;
  }

  return steps.every((step) => step.assertions.length > 0);
};
