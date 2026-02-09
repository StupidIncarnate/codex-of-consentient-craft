/**
 * PURPOSE: Defines a directed edge in a dependency graph for cycle detection
 *
 * USAGE:
 * const edge: DagEdge = dagEdgeContract.parse({ id: 'step-uuid', dependsOn: ['other-uuid'] });
 * // Returns validated DagEdge with id and dependency list
 */
import { z } from 'zod';

export const dagEdgeContract = z.object({
  id: z.string().min(1).brand<'DagNodeId'>(),
  dependsOn: z.array(z.string().min(1).brand<'DagNodeId'>()),
});

export type DagEdge = z.infer<typeof dagEdgeContract>;
