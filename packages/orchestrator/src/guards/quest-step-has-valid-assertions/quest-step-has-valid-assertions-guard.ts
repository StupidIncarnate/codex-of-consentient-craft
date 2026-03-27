/**
 * PURPOSE: Validates that steps with non-Void outputContracts have at least one VALID assertion
 *
 * USAGE:
 * questStepHasValidAssertionsGuard({steps});
 * // Returns true if all steps with non-Void outputContracts have a VALID assertion, false otherwise
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

  for (const step of steps) {
    const hasNonVoidOutput =
      step.outputContracts.length > 0 &&
      !(step.outputContracts.length === 1 && String(step.outputContracts[0]) === 'Void');

    if (!hasNonVoidOutput) {
      continue;
    }

    const hasValidAssertion = step.assertions.some((a) => a.prefix === 'VALID');

    if (!hasValidAssertion) {
      return false;
    }
  }

  return true;
};
