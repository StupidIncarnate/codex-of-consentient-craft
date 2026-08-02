/**
 * PURPOSE: Enumerates every simple route through a flow graph, from each entry node to each
 * terminal, recording the labelled decision branches taken along the way
 *
 * USAGE:
 * qaWalkPathsTransformer({ flow });
 * // Returns QaWalkPath[] — every itinerary a walker could be dispatched to drive
 *
 * Called with no `fromNodeId` it derives the entry nodes (those no local edge points at) and
 * recurses from each; the recursive calls thread the accumulated node list and branch labels down,
 * so every returned path is complete from its entry rather than a suffix needing reassembly.
 *
 * Paths are SIMPLE — a node never repeats. This is what makes enumeration terminate on graphs with
 * back-edges (a "Shift+Enter inserts a newline, return to the editor" loop), and it is also the
 * honest unit of work: a walker drives a route once, and re-entering a loop adds no coverage the
 * first traversal did not already provide. Loop behaviour is covered by the `re-entry` off-map
 * family instead, which the checklist emits separately.
 *
 * An edge whose target is a cross-flow `flowId:nodeId` ref — or an id no node in this flow
 * declares — ends the path with `exitsFlow: true` rather than being dropped, so a route out of the
 * flow is still visible as a route rather than vanishing from the itinerary list.
 */

import { qaWalkPathContract } from '@dungeonmaster/shared/contracts';
import type { Flow, FlowNodeId, QaWalkPath } from '@dungeonmaster/shared/contracts';

export const qaWalkPathsTransformer = ({
  flow,
  fromNodeId,
  visitedNodeIds = [],
  branchLabels = [],
}: {
  flow: Flow;
  fromNodeId?: FlowNodeId;
  visitedNodeIds?: readonly FlowNodeId[];
  branchLabels?: readonly string[];
}): QaWalkPath[] => {
  if (fromNodeId === undefined) {
    const localTargets = new Set(
      flow.edges.map((edge) => String(edge.to)).filter((ref) => !ref.includes(':')),
    );
    const entryNodes = flow.nodes.filter((node) => !localTargets.has(String(node.id)));
    // A fully cyclic graph has no node without an inbound edge; start at the first declared node
    // so such a flow still yields itineraries rather than silently enumerating none.
    const roots = entryNodes.length > 0 ? entryNodes : flow.nodes.slice(0, 1);
    return roots.flatMap((node) => qaWalkPathsTransformer({ flow, fromNodeId: node.id }));
  }

  const nodeIds = [...visitedNodeIds, fromNodeId];
  const onPath = new Set(nodeIds.map(String));
  const outgoing = flow.edges.filter((edge) => String(edge.from) === String(fromNodeId));

  if (outgoing.length === 0) {
    return [qaWalkPathContract.parse({ nodeIds, branchLabels, exitsFlow: false })];
  }

  const continuations = outgoing.flatMap((edge) => {
    const target = String(edge.to);
    const edgeLabel = edge.label === undefined ? '' : String(edge.label);
    const nextLabels = edgeLabel.length > 0 ? [...branchLabels, edgeLabel] : branchLabels;

    if (target.includes(':')) {
      return [qaWalkPathContract.parse({ nodeIds, branchLabels: nextLabels, exitsFlow: true })];
    }
    if (onPath.has(target)) {
      return [];
    }

    const targetNode = flow.nodes.find((node) => String(node.id) === target);
    if (targetNode === undefined) {
      return [qaWalkPathContract.parse({ nodeIds, branchLabels: nextLabels, exitsFlow: true })];
    }

    return qaWalkPathsTransformer({
      flow,
      fromNodeId: targetNode.id,
      visitedNodeIds: nodeIds,
      branchLabels: nextLabels,
    });
  });

  // Every outgoing edge looped back onto this path, so this node is where the route actually ends.
  if (continuations.length === 0) {
    return [qaWalkPathContract.parse({ nodeIds, branchLabels, exitsFlow: false })];
  }

  return continuations;
};
