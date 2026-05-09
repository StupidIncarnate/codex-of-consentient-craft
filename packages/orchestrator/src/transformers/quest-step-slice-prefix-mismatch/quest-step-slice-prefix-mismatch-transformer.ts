/**
 * PURPOSE: Returns descriptions of steps whose id does not start with their slice's name followed by a dash
 *
 * USAGE:
 * questStepSlicePrefixMismatchTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["step 'create-login-api' has slice 'backend' but id does not start with 'backend-'"].
 *
 * Every step's `id` must be prefixed with its `slice` value followed by a dash. Slice authority is
 * established at minion-write time; this offender-finder enforces the prefix as a save-time invariant
 * tied to the step's actual slice value, not a regex pattern on id alone.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepSlicePrefixMismatchTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps) {
    return [];
  }

  const offenders: ErrorMessage[] = [];
  for (const step of steps) {
    const id = String(step.id);
    const slice = String(step.slice);
    const expectedPrefix = `${slice}-`;
    if (!id.startsWith(expectedPrefix)) {
      offenders.push(
        errorMessageContract.parse(
          `step '${id}' has slice '${slice}' but id does not start with '${expectedPrefix}'`,
        ),
      );
    }
  }
  return offenders;
};
