/**
 * PURPOSE: Continues a routed step graph forward from a step along its `routes.done` edge alone,
 * stopping at a target that names no declared node in the graph. Reach for this to project the
 * REMAINDER of a scope; it never crosses a `routes.unmet` edge — a back-edge is real only once a
 * session actually takes it, at which point it belongs on the quest as a fresh work item, not on this
 * walk as a guess.
 *
 * USAGE:
 * agentFlowPlannedStepsWalkTransformer({
 *   graph: agentFlowFamilyResolveTransformer({ quest, operationItem }),
 *   cursor: RoutedGraphNodeKeyStub({ value: 'review' }),
 * });
 * // Returns ['review', 'commit', 'ward'] — 'review' plus the `done` chain onward to the family's
 * // own close-out, given `review.routes.done === 'commit'` and `commit.routes.done === 'ward'`
 *
 * `cursor` NAMES THE FIRST STEP TO INCLUDE, not the step to skip past — a caller that wants the walk
 * to start AFTER a step already represented elsewhere passes that step's OWN `routes.done` target as
 * `cursor`, not the step itself.
 *
 * NO SEPARATE `'@done'` / `'@blocked'` STRING COMPARISON — `graph.nodes[cursor] === undefined` already
 * catches both, since a routed graph's `nodes` map holds only real step keys and never the two reserved
 * terminal markers (`graphReachabilityViolationsTransformer`'s own rules are what keep it that way). A
 * mutation dropping an explicit sentinel comparison here was found to pass silently for exactly this
 * reason — it was dead code, not a missing test.
 */

import type { RoutedGraph, RoutedGraphNodeKey } from '@dungeonmaster/shared/contracts';

export const agentFlowPlannedStepsWalkTransformer = ({
  graph,
  cursor,
}: {
  graph: RoutedGraph;
  cursor: RoutedGraphNodeKey | undefined;
}): RoutedGraphNodeKey[] => {
  if (cursor === undefined) {
    return [];
  }

  const node = graph.nodes[cursor];

  if (node === undefined) {
    return [];
  }

  return [cursor, ...agentFlowPlannedStepsWalkTransformer({ graph, cursor: node.routes.done })];
};
