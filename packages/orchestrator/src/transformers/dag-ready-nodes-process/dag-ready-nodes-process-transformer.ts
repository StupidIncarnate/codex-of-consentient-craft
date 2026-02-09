/**
 * PURPOSE: Recursively processes ready nodes in a DAG topological sort, returning sorted node IDs
 *
 * USAGE:
 * dagReadyNodesProcessTransformer({ready: ['a'], depsRemaining, dependents, processed: []});
 * // Returns accumulated sorted node IDs after processing all reachable ready nodes
 */
import type { DagEdge } from '../../contracts/dag-edge/dag-edge-contract';

type DagNodeId = DagEdge['id'];

export const dagReadyNodesProcessTransformer = ({
  ready,
  depsRemaining,
  dependents,
  processed,
}: {
  ready: DagNodeId[];
  depsRemaining: Map<DagNodeId, DagNodeId[]>;
  dependents: Map<DagNodeId, DagNodeId[]>;
  processed: DagNodeId[];
}): DagNodeId[] => {
  if (ready.length === 0) {
    return processed;
  }

  const newProcessed = [...processed, ...ready];

  const newlyReady: DagNodeId[] = [];
  for (const readyId of ready) {
    const deps = dependents.get(readyId) ?? [];
    for (const depId of deps) {
      const remaining = depsRemaining.get(depId);
      if (remaining) {
        const filtered = remaining.filter((d) => d !== readyId);
        depsRemaining.set(depId, filtered);
        if (filtered.length === 0) {
          newlyReady.push(depId);
        }
      }
    }
  }

  return dagReadyNodesProcessTransformer({
    ready: newlyReady,
    depsRemaining,
    dependents,
    processed: newProcessed,
  });
};
