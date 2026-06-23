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
import type { Node, Edge, NodeTypes, ReactFlowProps } from '@xyflow/react';

import type { ReactFlowNodeData } from '../../../contracts/react-flow-node-data/react-flow-node-data-contract';

export type XyflowReactFlowAdapterNode = Node<ReactFlowNodeData>;

export interface XyflowReactFlowAdapterProps {
  nodes: XyflowReactFlowAdapterNode[];
  edges: Edge[];
  nodeTypes?: NodeTypes;
  onNodeClick?: (node: XyflowReactFlowAdapterNode) => void;
  onPaneClick?: () => void;
}

export const xyflowReactFlowAdapter = ({
  nodes,
  edges,
  nodeTypes,
  onNodeClick,
  onPaneClick,
}: XyflowReactFlowAdapterProps): React.ReactElement => {
  const reactFlowProps: ReactFlowProps<XyflowReactFlowAdapterNode> = {
    nodes,
    edges,
    ...(nodeTypes === undefined ? {} : { nodeTypes }),
    onNodeClick: (_event, node) => {
      onNodeClick?.(node);
    },
    // React Flow's native pane-click callback — the real pane is `.react-flow__pane`
    // (no testid), so deselect must hook this API rather than sniffing a DOM testid.
    onPaneClick: () => {
      onPaneClick?.();
    },
    fitView: true,
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
