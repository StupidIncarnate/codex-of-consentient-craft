/**
 * PURPOSE: Answers whether any check in a finished run reported a handle still holding the event
 * loop. Reach for this to decide the run's EXIT CODE.
 *
 * An empty answer is not proof of a clean run — it is also what a run that never looked returns.
 * Jest's own detection rides the FILE-scoped branch only, and the timer watch rides the worker
 * branch only, so which leaks a run could have seen depends on the scope it was given.
 *
 * USAGE:
 * hasOpenHandlesGuard({wardResult: WardResultStub()});
 * // Returns true when at least one suite left a handle armed
 */

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';

export const hasOpenHandlesGuard = ({ wardResult }: { wardResult?: WardResult }): boolean => {
  if (!wardResult) {
    return false;
  }

  return wardResult.checks.some((check) =>
    check.projectResults.some((projectResult) => projectResult.openHandles.length > 0),
  );
};
