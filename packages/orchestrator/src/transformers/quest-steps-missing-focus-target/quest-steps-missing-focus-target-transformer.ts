/**
 * PURPOSE: Returns descriptions of steps that have neither focusFile nor focusAction set
 *
 * USAGE:
 * questStepsMissingFocusTargetTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["step 'create-user-api' has neither focusFile nor focusAction"].
 *
 * A step must have exactly one of focusFile (file-owning) or focusAction (verification/command).
 * The dependency-step contract keeps both optional to express the either/or relationship, so this
 * offender-finder enforces the "at least one must be set" invariant at transition time.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepsMissingFocusTargetTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps) {
    return [];
  }

  const offenders: ErrorMessage[] = [];
  for (const step of steps) {
    if (step.focusFile === undefined && step.focusAction === undefined) {
      offenders.push(
        errorMessageContract.parse(
          `step '${String(step.id)}' has neither focusFile nor focusAction`,
        ),
      );
    }
  }
  return offenders;
};
