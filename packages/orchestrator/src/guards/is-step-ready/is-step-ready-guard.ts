/**
 * PURPOSE: Checks if a step is ready to be executed based on its dependencies
 *
 * USAGE:
 * isStepReadyGuard({step, allSteps});
 * // Returns true if step's status is 'pending' and all dependsOn steps are 'complete'
 */

import type { DependencyStep } from '@dungeonmaster/shared/contracts';

export const isStepReadyGuard = ({
  step,
  allSteps,
}: {
  step?: DependencyStep;
  allSteps?: DependencyStep[];
}): boolean => {
  if (!step || !allSteps) {
    return false;
  }

  if (step.status !== 'pending') {
    return false;
  }

  if (step.dependsOn.length === 0) {
    return true;
  }

  const dependencyStatuses = step.dependsOn.map((depId) => {
    const depStep = allSteps.find((s) => s.id === depId);
    return depStep?.status;
  });

  return dependencyStatuses.every((status) => status === 'complete');
};
