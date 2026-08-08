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
import { nodeMeasureLayerAdapter } from './node-measure-layer-adapter';

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
  // When true, frame the graph on the entry (first) node — horizontally centered near the top, at
  // natural card size — instead of React Flow's fit-everything-and-center. The spec panel's diagram
  // sets this, so switching flow tabs starts the reader AT the first step rather than shrinking a
  // tall graph until every card is a speck. Omitted leaves React Flow's fit-the-whole-graph.
  topAlign?: boolean;
}

export const xyflowReactFlowAdapter = ({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  onNodeClick,
  onPaneClick,
  topAlign,
}: XyflowReactFlowAdapterProps): React.ReactElement => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const shouldTopAlign = topAlign === true;

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
    // When top-aligning, leave React Flow's fit-view off and frame the graph ourselves in `onInit`
    // (below) so there is no fit-everything-then-jump flash. Otherwise (fullscreen overview) let
    // fit-view frame the whole graph and center it.
    fitView: !shouldTopAlign,
    onInit: (instance) => {
      // Frame the diagram ON the ENTRY node (the topmost flow card — the single first step every
      // flow starts with): horizontally centered, `topPadding` below the canvas top, at natural
      // card size. The rest of the graph runs off the bottom for the reader to scroll to.
      //
      // Zoom is sized to ONE STEP of the flow — from the entry card's center out to the right edge
      // of the assertion column branching off it, which is the farther side of a centered card and
      // so the one that decides the fit. That span is the same whether the graph is four nodes or
      // forty. Sizing to the whole graph's span instead is what shrank a wide assertion-rich flow
      // until its labels were unreadable, and made the load zoom depend on how much of the flow
      // happened to sit off to one side. Sizing to the card ALONE is the opposite failure: it pushes
      // the entry's own assertions past the canvas edge in a narrow panel, where a reader cannot
      // reach them — this canvas pans rather than scrolls, so just-off-screen reads as absent.
      // `maxZoom` caps it, so a panel with room renders 1:1 and only a panel too narrow for a single
      // step zooms out at all.
      //
      // Geometry comes from the ELK node positions (the exact boxes ELK reserved) + the static card
      // widths, so this does not race React Flow's async node measurement. `onInit` fires once per
      // mount; the widget remounts on a flow-tab switch, so every top-aligned load re-frames.
      const container = containerRef.current;
      const canvasWidth = container?.clientWidth ?? 0;
      const [firstFlowNode, ...restFlowNodes] = nodes.filter(
        (node) => node.type !== 'observable' && node.type !== 'portal',
      );
      if (
        !shouldTopAlign ||
        container === null ||
        canvasWidth === 0 ||
        firstFlowNode === undefined
      ) {
        return;
      }
      const { minZoom, maxZoom, topPadding, sidePadding, centerDivisor } =
        elkLayoutStatics.viewport;
      const entryNode = restFlowNodes.reduce(
        (topmost, node) => (node.position.y < topmost.position.y ? node : topmost),
        firstFlowNode,
      );
      const halfStep =
        elkLayoutStatics.node.width / centerDivisor +
        elkLayoutStatics.observable.gap +
        elkLayoutStatics.observable.width;
      const halfCanvas = canvasWidth / centerDivisor - sidePadding;
      const zoom = Math.min(maxZoom, Math.max(minZoom, halfCanvas / halfStep));
      const entryCenterX = entryNode.position.x + elkLayoutStatics.node.width / centerDivisor;
      instance
        .setViewport({
          x: canvasWidth / centerDivisor - entryCenterX * zoom,
          y: topPadding - entryNode.position.y * zoom,
          zoom,
        })
        .catch((viewportError: unknown) => {
          globalThis.console.error('[xyflow-react-flow] setViewport failed', viewportError);
        });
    },
    // Lower the zoom floor below React Flow's 0.5 default so the top-align fit-width (and the manual
    // fit-view button) can shrink a wide graph's full width into the canvas, and so the user's
    // manual zoom-out can go lower.
    minZoom: elkLayoutStatics.viewport.minZoom,
    fitViewOptions: { minZoom: elkLayoutStatics.viewport.minZoom },
  };

  return React.createElement(
    'div',
    {
      ref: containerRef,
      'data-testid': 'REACT_FLOW_CANVAS',
      style: { width: '100%', height: '100%' },
    },
    React.createElement(
      ReactFlow<XyflowReactFlowAdapterNode>,
      reactFlowProps,
      // Controls stays mounted (the diagram widget's custom RPG buttons drive zoom/fit by
      // clicking its actuator buttons) but is hidden so it doesn't paint a second control
      // cluster on top of the custom one.
      React.createElement(Controls, { key: 'controls', style: { display: 'none' } }),
      // Renders nothing; it is here for its effect, which needs React Flow's store and so has to be
      // a CHILD of <ReactFlow> rather than a call in this component.
      React.createElement(nodeMeasureLayerAdapter, {
        key: 'node-measure',
        nodeIds: nodes.map((node) => node.id).join('\n'),
      }),
    ),
  );
};
