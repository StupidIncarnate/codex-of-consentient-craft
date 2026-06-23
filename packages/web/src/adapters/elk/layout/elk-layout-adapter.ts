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
import { elkLayoutStatics } from '../../../statics/elk-layout/elk-layout-statics';

export const elkLayoutAdapter = async ({
  nodes,
  edges,
}: {
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
}): Promise<ElkPositionMap> => {
  const elk = new ELK();

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
    children: nodes.map((n) => ({
      id: String(n.id),
      width: elkLayoutStatics.node.width,
      height: elkLayoutStatics.node.height,
    })),
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
