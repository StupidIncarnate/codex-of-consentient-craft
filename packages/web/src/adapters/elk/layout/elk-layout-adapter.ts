/**
 * PURPOSE: Wraps elkjs to compute x/y positions for flow graph nodes using the layered algorithm
 *
 * USAGE:
 * const positions = await elkLayoutAdapter({ nodes, edges });
 * // positions['login-page'] => { x: 0, y: 0 }
 * // positions['dashboard'] => { x: 0, y: 120 }
 *
 * WHEN-TO-USE: Before rendering a flow graph — call once per layout pass to get node coordinates
 * WHEN-NOT-TO-USE: Do not call inside React render; call in an effect or event handler
 */

import ELK from 'elkjs';

import type { FlowEdge, FlowNode } from '@dungeonmaster/shared/contracts';

import { elkPositionMapContract } from '../../../contracts/elk-position-map/elk-position-map-contract';
import type { ElkPositionMap } from '../../../contracts/elk-position-map/elk-position-map-contract';
import type { FlowPortalNodeData } from '../../../contracts/flow-portal-node-data/flow-portal-node-data-contract';
import { elkLayoutStatics } from '../../../statics/elk-layout/elk-layout-statics';

export const elkLayoutAdapter = async ({
  nodes,
  edges,
  portals = [],
}: {
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
  // Cross-flow portal stand-ins. Their `reference` becomes a graph child id so an edge whose
  // endpoint lives in another flow resolves — without them elk throws on the unknown endpoint.
  portals?: readonly FlowPortalNodeData[];
}): Promise<ElkPositionMap> => {
  const elk = new ELK();

  const nodeChildren = nodes.map((n) => {
    // Reserve a box tall enough for the node's FULL wrapped label so stacked rows never
    // overlap. charsPerLine is deliberately low (over-counts wrapped lines), making the
    // reserved height an upper bound on the rendered card height. The contract badge height is
    // reserved unconditionally — the badge (contract count) is rendered by the card from data
    // this layout never sees, so over-reserving keeps the box an upper bound.
    const { labelEstimate, observable } = elkLayoutStatics;
    const lines = Math.max(1, Math.ceil(String(n.label).length / labelEstimate.charsPerLine));
    const cardHeight =
      labelEstimate.chromeHeight +
      lines * labelEstimate.lineHeight +
      labelEstimate.badgeHeight +
      labelEstimate.buffer;
    // Assertion cards branch into a column to the right of the card; reserve the column's full
    // height so it never overlaps a lower node. Each card's height is estimated from its
    // description length (low charsPerLine over-counts wrapped lines), summed with rowGaps.
    const columnHeight = n.observables.reduce((sum, obs, index) => {
      const obsLines = Math.max(
        1,
        Math.ceil(String(obs.description).length / observable.labelEstimate.charsPerLine),
      );
      const obsCardHeight =
        observable.labelEstimate.chromeHeight +
        obsLines * observable.labelEstimate.lineHeight +
        observable.labelEstimate.buffer;
      return sum + (index === 0 ? 0 : observable.rowGap) + obsCardHeight;
    }, 0);
    return {
      id: String(n.id),
      width: elkLayoutStatics.node.width,
      height: Math.max(cardHeight, columnHeight),
    };
  });

  // Portal stand-ins for off-flow edge endpoints. Reserve a single-label-height box so the portal
  // card clears its neighbours; its id is the raw cross-flow reference the edge targets, so an
  // otherwise-unresolvable endpoint now points at a real graph child instead of throwing layout.
  const portalChildren = portals.map((p) => {
    const { labelEstimate } = elkLayoutStatics;
    const lines = Math.max(1, Math.ceil(String(p.label).length / labelEstimate.charsPerLine));
    return {
      id: String(p.reference),
      width: elkLayoutStatics.node.width,
      height: labelEstimate.chromeHeight + lines * labelEstimate.lineHeight + labelEstimate.buffer,
    };
  });

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
      // Spread sibling branches and layers apart so adjacent cards — and the branch-edge labels
      // painted at edge midpoints — have room and don't collide.
      'elk.spacing.nodeNode': String(elkLayoutStatics.spacing.nodeNode),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(
        elkLayoutStatics.spacing.nodeNodeBetweenLayers,
      ),
      'elk.spacing.edgeNode': String(elkLayoutStatics.spacing.edgeNode),
      'elk.spacing.edgeEdge': String(elkLayoutStatics.spacing.edgeEdge),
    },
    children: [...nodeChildren, ...portalChildren],
    edges: edges.map((e) => ({
      id: String(e.id),
      sources: [String(e.from)],
      targets: [String(e.to)],
    })),
  };

  const result = await elk.layout(graph);

  const positionEntries = Object.fromEntries(
    (result.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]),
  );

  return elkPositionMapContract.parse(positionEntries);
};
