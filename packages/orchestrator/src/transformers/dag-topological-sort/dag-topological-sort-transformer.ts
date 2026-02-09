/**
 * PURPOSE: Performs topological sort on a DAG, returning the sorted node IDs or empty array if cycle detected
 *
 * USAGE:
 * dagTopologicalSortTransformer({edges: [{id: 'a', dependsOn: []}, {id: 'b', dependsOn: ['a']}]});
 * // Returns ['a', 'b'] if valid DAG, or [] if cycle detected
 */
import type { DagEdge } from '../../contracts/dag-edge/dag-edge-contract';

import { dagReadyNodesProcessTransformer } from '../dag-ready-nodes-process/dag-ready-nodes-process-transformer';

type DagNodeId = DagEdge['id'];

export const dagTopologicalSortTransformer = ({ edges }: { edges: DagEdge[] }): DagNodeId[] => {
  if (edges.length === 0) {
    return [];
  }

  const depsRemaining = new Map<DagNodeId, DagNodeId[]>();
  const dependents = new Map<DagNodeId, DagNodeId[]>();

  for (const edge of edges) {
    depsRemaining.set(edge.id, [...edge.dependsOn]);
    dependents.set(edge.id, []);
  }

  for (const edge of edges) {
    for (const depId of edge.dependsOn) {
      const existing = dependents.get(depId);
      if (existing) {
        existing.push(edge.id);
      }
    }
  }

  const allIds = edges.map((e) => e.id);
  const ready = allIds.filter((id) => (depsRemaining.get(id) ?? []).length === 0);

  return dagReadyNodesProcessTransformer({
    ready,
    depsRemaining,
    dependents,
    processed: [],
  });
};
