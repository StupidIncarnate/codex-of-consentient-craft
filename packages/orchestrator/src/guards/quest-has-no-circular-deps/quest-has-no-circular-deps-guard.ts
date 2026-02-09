/**
 * PURPOSE: Validates that the step dependency graph is a valid DAG with no circular dependencies
 *
 * USAGE:
 * questHasNoCircularDepsGuard({steps});
 * // Returns true if step dependency graph has no cycles, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { dagEdgeContract } from '../../contracts/dag-edge/dag-edge-contract';
import { dagTopologicalSortTransformer } from '../../transformers/dag-topological-sort/dag-topological-sort-transformer';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questHasNoCircularDepsGuard = ({ steps }: { steps?: DependencyStep[] }): boolean => {
  if (!steps) {
    return false;
  }

  if (steps.length === 0) {
    return true;
  }

  const edges = steps.map((step) =>
    dagEdgeContract.parse({
      id: step.id,
      dependsOn: [...step.dependsOn],
    }),
  );

  const sorted = dagTopologicalSortTransformer({ edges });

  return sorted.length === steps.length;
};
