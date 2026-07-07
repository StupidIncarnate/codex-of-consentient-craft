/**
 * PURPOSE: Boundary wrapper around @xyflow/react — renders a ReactFlow canvas inside a
 * REACT_FLOW_CANVAS container. Consumers supply nodeTypes whose components render
 * FLOW_NODE testids; the adapter guarantees the canvas + node-count + click-callback contract.
 *
 * USAGE:
 * React.createElement(xyflowReactFlowAdapter, {
 *   nodes,
 *   edges,
 *   nodeTypes,
 *   onNodeClick: (node) => selectNode(node.data),
 * });
 * // Renders a ReactFlow canvas; fires onNodeClick with the clicked node on click.
 */

import React from 'react';

import { Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Node, Edge, NodeTypes, EdgeTypes, ReactFlowProps } from '@xyflow/react';

import type { FlowObservableNodeData } from '../../../contracts/flow-observable-node-data/flow-observable-node-data-contract';
import type { FlowPortalNodeData } from '../../../contracts/flow-portal-node-data/flow-portal-node-data-contract';
import type { ReactFlowNodeData } from '../../../contracts/react-flow-node-data/react-flow-node-data-contract';
import { elkLayoutStatics } from '../../../statics/elk-layout/elk-layout-statics';

// The canvas holds three node shapes: flow cards (ReactFlowNodeData), the assertion cards that
// branch off to their right (FlowObservableNodeData), and portal stand-ins for cross-flow edge
// endpoints (FlowPortalNodeData). All carry a string `id`, which is all the click handler reads to
// resolve the clicked node back to a flow node.
export type XyflowReactFlowAdapterNode =
  | Node<ReactFlowNodeData>
  | Node<FlowObservableNodeData>
  | Node<FlowPortalNodeData>;

export interface XyflowReactFlowAdapterProps {
  nodes: XyflowReactFlowAdapterNode[];
  edges: Edge[];
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  onNodeClick?: (node: XyflowReactFlowAdapterNode) => void;
  onPaneClick?: () => void;
}

export const xyflowReactFlowAdapter = ({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  onNodeClick,
  onPaneClick,
}: XyflowReactFlowAdapterProps): React.ReactElement => {
  const reactFlowProps: ReactFlowProps<XyflowReactFlowAdapterNode> = {
    nodes,
    edges,
    ...(nodeTypes === undefined ? {} : { nodeTypes }),
    ...(edgeTypes === undefined ? {} : { edgeTypes }),
    onNodeClick: (_event, node) => {
      onNodeClick?.(node);
    },
    // React Flow's native pane-click callback — the real pane is `.react-flow__pane`
    // (no testid), so deselect must hook this API rather than sniffing a DOM testid.
    onPaneClick: () => {
      onPaneClick?.();
    },
    fitView: true,
    // Lower the zoom floor (and fit-view's own floor) below React Flow's 0.5 default so fit-view
    // can shrink a tall assertion-rich graph into the collapsed canvas instead of clamping and
    // leaving the graph partly outside the viewport (which reads as "blank until fullscreen").
    minZoom: elkLayoutStatics.viewport.minZoom,
    fitViewOptions: { minZoom: elkLayoutStatics.viewport.minZoom },
  };

  return React.createElement(
    'div',
    { 'data-testid': 'REACT_FLOW_CANVAS', style: { width: '100%', height: '100%' } },
    React.createElement(
      ReactFlow<XyflowReactFlowAdapterNode>,
      reactFlowProps,
      // Controls stays mounted (the diagram widget's custom RPG buttons drive zoom/fit by
      // clicking its actuator buttons) but is hidden so it doesn't paint a second control
      // cluster on top of the custom one.
      React.createElement(Controls, { style: { display: 'none' } }),
    ),
  );
};
