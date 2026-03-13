/**
 * PURPOSE: Maps failed observable IDs to the step IDs whose observablesSatisfied contain them
 *
 * USAGE:
 * failedObservablesToStepIdsTransformer({failedObservableIds, steps});
 * // Returns: array of StepId values for steps that satisfy the failed observables
 */

import type { DependencyStep, ObservableId, StepId } from '@dungeonmaster/shared/contracts';

export const failedObservablesToStepIdsTransformer = ({
  failedObservableIds,
  steps,
}: {
  failedObservableIds: readonly ObservableId[];
  steps: readonly DependencyStep[];
}): StepId[] => {
  if (failedObservableIds.length === 0) {
    return [];
  }

  const failedSet = new Set<ObservableId>(failedObservableIds);

  return steps
    .filter((step) => step.observablesSatisfied.some((obsId) => failedSet.has(obsId)))
    .map((step) => step.id);
};
