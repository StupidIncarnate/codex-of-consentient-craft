/**
 * PURPOSE: Validates that every observable embedded in flow nodes is referenced by at least one step's observablesSatisfied array
 *
 * USAGE:
 * questHasObservableCoverageGuard({flows, steps});
 * // Returns true if all flow node observables are covered by at least one step, false otherwise
 */
import type { DependencyStepStub, FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questHasObservableCoverageGuard = ({
  flows,
  steps,
}: {
  flows?: Flow[];
  steps?: DependencyStep[];
}): boolean => {
  if (!flows || !steps) {
    return false;
  }

  const allObservableIds = flows.flatMap((flow) =>
    flow.nodes.flatMap((node) => node.observables.map((obs) => obs.id)),
  );

  if (allObservableIds.length === 0) {
    return true;
  }

  const coveredIds = new Set(steps.flatMap((step) => step.observablesSatisfied));

  return allObservableIds.every((obsId) => coveredIds.has(obsId));
};
