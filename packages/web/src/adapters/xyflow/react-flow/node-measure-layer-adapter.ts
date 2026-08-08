/**
 * PURPOSE: Recovers the one node measurement React Flow will never retake on its own. A card is a
 * fixed box, so its ResizeObserver fires once and never again; `adoptUserNodes` throws that
 * measurement away for any node object it has not seen before; and an unmeasured node has no handle
 * bounds, which React Flow reports by silently dropping EVERY EDGE that touches it. Mounted inside
 * `<ReactFlow>` (the store hooks it uses are only available to a child) purely for that effect —
 * it renders nothing.
 *
 * USAGE:
 * React.createElement(nodeMeasureLayerAdapter, { nodeIds: nodes.map((n) => n.id).join('\n') });
 * // Forces a re-measure on the next frame whenever the graph is still unmeasured
 */

import React from 'react';

import { useNodesInitialized, useUpdateNodeInternals } from '@xyflow/react';

// The ids arrive joined because a fresh array every render would re-fire the effect every render,
// which is the very churn this file exists to survive. A node id is a flow node id, a
// `flowId:nodeId` portal reference or an `obs:node:observable` composite — none can hold a newline.
const ID_SEPARATOR = '\n';

export const nodeMeasureLayerAdapter = ({
  nodeIds,
}: {
  nodeIds: string;
}): React.JSX.Element | null => {
  const nodesInitialized = useNodesInitialized();
  const updateNodeInternals = useUpdateNodeInternals();

  React.useEffect(() => {
    // `nodesInitialized` is React Flow's own answer to "does every node have dimensions". False
    // with cards on screen means a measurement was lost, so ask for it again — `updateNodeInternals`
    // measures from the DOM on the next animation frame, which is after the render that lost it.
    // Nothing loops: a successful pass flips `nodesInitialized` and this guard stops it, and a pass
    // that changes nothing leaves both dependencies as they were, so the effect does not re-run.
    if (nodesInitialized || nodeIds === '') {
      return;
    }
    updateNodeInternals(nodeIds.split(ID_SEPARATOR));
  }, [nodeIds, nodesInitialized, updateNodeInternals]);

  return null;
};
