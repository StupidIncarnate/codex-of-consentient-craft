/**
 * PURPOSE: Returns descriptions of step dependsOn references that point to non-existent step ids
 *
 * USAGE:
 * questUnresolvedStepDepsTransformer({steps});
 * // Returns ErrorMessage[] — e.g. ["step 'b' depends on unknown step 'ghost'"].
 *
 * A well-formed quest step graph requires every dependsOn entry to resolve to another step's id
 * within the same quest. This offender-finder surfaces dangling references before transitioning
 * into in_progress.
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questUnresolvedStepDepsTransformer = ({
  steps,
}: {
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!steps) {
    return [];
  }

  const knownIds = new Set<unknown>();
  for (const step of steps) {
    knownIds.add(String(step.id));
  }

  const offenders: ErrorMessage[] = [];
  for (const step of steps) {
    for (const dep of step.dependsOn) {
      if (!knownIds.has(String(dep))) {
        offenders.push(
          errorMessageContract.parse(
            `step '${String(step.id)}' depends on unknown step '${String(dep)}'`,
          ),
        );
      }
    }
  }
  return offenders;
};
