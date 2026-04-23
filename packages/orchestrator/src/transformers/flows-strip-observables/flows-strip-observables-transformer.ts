/**
 * PURPOSE: Produces a copy of Flow[] with every flow node's observables array replaced by an empty array
 *
 * USAGE:
 * flowsStripObservablesTransformer({ flows });
 * // Returns: Flow[] with node.observables = [] everywhere; structural changes (nodes/edges/ids) preserved
 *
 * WHEN-TO-USE: By the hydrator when sending flows during the `no-observables` transitions (explore_flows -> review_flows) where flowsRule forbids populated observables.
 */

import type { Flow } from '@dungeonmaster/shared/contracts';

export const flowsStripObservablesTransformer = ({ flows }: { flows: Flow[] }): Flow[] =>
  flows.map((flow) => ({
    ...flow,
    nodes: flow.nodes.map((node) => ({
      ...node,
      observables: [],
    })),
  }));
