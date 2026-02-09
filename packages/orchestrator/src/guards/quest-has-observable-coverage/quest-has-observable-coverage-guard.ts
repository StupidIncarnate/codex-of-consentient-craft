/**
 * PURPOSE: Validates that every observable ID is referenced by at least one step's observablesSatisfied array
 *
 * USAGE:
 * questHasObservableCoverageGuard({observables, steps});
 * // Returns true if all observables are covered by at least one step, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import type { ObservableStub } from '@dungeonmaster/shared/contracts';

type Observable = ReturnType<typeof ObservableStub>;
type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questHasObservableCoverageGuard = ({
  observables,
  steps,
}: {
  observables?: Observable[];
  steps?: DependencyStep[];
}): boolean => {
  if (!observables || !steps) {
    return false;
  }

  if (observables.length === 0) {
    return true;
  }

  const coveredIds = new Set(steps.flatMap((step) => step.observablesSatisfied));

  return observables.every((obs) => coveredIds.has(obs.id));
};
