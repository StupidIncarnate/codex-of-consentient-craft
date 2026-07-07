/**
 * PURPOSE: Derives the "portal" stand-in nodes a flow diagram needs for edges that point at a node
 * in ANOTHER flow (the `flowId:nodeId` cross-flow reference the spec allows on FlowEdge.from/to).
 * Such an endpoint is not among this flow's own nodes, so ELK and React Flow have nothing to anchor
 * the edge to — ELK's layout throws on the unresolvable endpoint. A portal node stands in for the
 * off-flow target so the edge, and the cross-flow hand-off it represents, renders instead.
 *
 * USAGE:
 * flowCrossFlowPortalsTransformer({ nodes: flow.nodes, edges: flow.edges });
 * // => [{ reference: 'compile-flow:compile-entry', label: '↗ compile-flow → compile-entry' }]
 * // Returns [] when every edge endpoint resolves to a local node.
 */

import type { FlowEdge, FlowNode } from '@dungeonmaster/shared/contracts';

import { flowPortalNodeDataContract } from '../../contracts/flow-portal-node-data/flow-portal-node-data-contract';
import type { FlowPortalNodeData } from '../../contracts/flow-portal-node-data/flow-portal-node-data-contract';

export const flowCrossFlowPortalsTransformer = ({
  nodes,
  edges,
}: {
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
}): readonly FlowPortalNodeData[] => {
  const localIds = new Set(nodes.map((n) => String(n.id)));

  const offFlowReferences = edges
    .flatMap((edge) => [String(edge.from), String(edge.to)])
    .filter((reference) => !localIds.has(reference));

  // Dedupe while preserving first-seen order — a target referenced by two edges yields one portal.
  const uniqueReferences = [...new Set(offFlowReferences)];

  return uniqueReferences.map((reference) => {
    // A cross-flow reference is `flowId:nodeId`; render it as "flowId → nodeId" so the hand-off
    // reads left-to-right. A bare unresolved ref (no colon) keeps its raw text.
    const separatorIndex = reference.indexOf(':');
    const label =
      separatorIndex === -1
        ? `↗ ${reference}`
        : `↗ ${reference.slice(0, separatorIndex)} → ${reference.slice(separatorIndex + 1)}`;

    return flowPortalNodeDataContract.parse({ reference, label });
  });
};
