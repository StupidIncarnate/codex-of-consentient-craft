const React = require('react');

/**
 * Lightweight mock for @xyflow/react used in jsdom unit tests.
 *
 * ReactFlow renders one node per entry in the `nodes` prop. When a custom node
 * component is registered under `nodeTypes[node.type]`, that component is rendered
 * with `{ id, data, selected }` so the widget's node-card visuals (icons, badges,
 * accent colors, data-selected styling) are assertable. When no matching custom node
 * type exists, a bare div[data-testid=FLOW_NODE] is rendered as a fallback.
 *
 * `onNodeClick(event, node)` fires when a node wrapper is clicked. A node's `selected`
 * flag is derived from the `selected` field on the node object the consumer passes in.
 *
 * Edges render their `label` (when present) inside a div[data-testid=FLOW_EDGE_LABEL].
 *
 * `onPaneClick` fires when the canvas background (the pane) is clicked.
 *
 * All other exports are stubs sufficient to satisfy import-time usage.
 */
const ReactFlow = ({ nodes, edges, nodeTypes, onNodeClick, onPaneClick, children }) => {
  const nodeEls = (nodes || []).map((node) => {
    const CustomNode = nodeTypes ? nodeTypes[node.type] : undefined;

    // When a custom node component is registered, let it own the FLOW_NODE element
    // (icons, badges, accent colors, data-selected). The wrapper only carries the
    // click handler. Without a custom node, render a bare FLOW_NODE fallback.
    if (CustomNode) {
      return React.createElement(
        'div',
        {
          key: node.id,
          'data-node-id': node.id,
          // Real React Flow keeps a node `visibility: hidden` until it has measured it, unless the
          // node arrives carrying initialWidth/initialHeight. Surfacing them here is what lets a
          // jsdom test assert the diagram never hands over a card with no pre-measurement box.
          'data-initial-width': node.initialWidth,
          'data-initial-height': node.initialHeight,
          onClick: (event) => onNodeClick && onNodeClick(event, node),
        },
        React.createElement(CustomNode, {
          id: node.id,
          data: node.data,
          selected: Boolean(node.selected),
          type: node.type,
        }),
      );
    }

    return React.createElement('div', {
      key: node.id,
      'data-testid': 'FLOW_NODE',
      'data-node-id': node.id,
      'data-initial-width': node.initialWidth,
      'data-initial-height': node.initialHeight,
      'data-selected': node.selected ? 'true' : undefined,
      onClick: (event) => onNodeClick && onNodeClick(event, node),
    });
  });

  const edgeEls = (edges || [])
    .filter((edge) => edge && edge.label !== undefined && edge.label !== null && edge.label !== '')
    .map((edge) =>
      React.createElement(
        'div',
        { key: edge.id, 'data-testid': 'FLOW_EDGE_LABEL', 'data-edge-id': edge.id },
        String(edge.label),
      ),
    );

  return React.createElement(
    'div',
    {
      className: 'react-flow-mock',
      'data-testid': 'REACT_FLOW_PANE',
      onClick: (event) => {
        if (event.target === event.currentTarget && onPaneClick) {
          onPaneClick(event);
        }
      },
    },
    ...nodeEls,
    ...edgeEls,
    children,
  );
};

const ReactFlowProvider = ({ children }) => React.createElement(React.Fragment, null, children);

const Background = () => null;
const Controls = () => null;
const Panel = ({ children }) => React.createElement(React.Fragment, null, children);
const Handle = () => null;
const EdgeLabelRenderer = ({ children }) => React.createElement(React.Fragment, null, children);
const BaseEdge = () => null;

const Position = {
  Top: 'top',
  Bottom: 'bottom',
  Left: 'left',
  Right: 'right',
};

const MarkerType = {
  Arrow: 'arrow',
  ArrowClosed: 'arrowclosed',
};

// Node measurement is a real-browser concern (layout + ResizeObserver), so jsdom stands in for it
// through the DOM: the proxy states the answer by setting an attribute on <body>, and every forced
// re-measure appends the ids it asked for to another. Routing both through the DOM rather than
// mock-only module exports keeps the proxy importing the SAME `@xyflow/react` surface the adapter
// does — a mock-only export would not exist on the real package's types. The separators are chosen
// to be characters no node id can hold: ids are kebab-case, `flowId:nodeId` or `obs:node:assertion`.
const NODES_INITIALIZED_ATTR = 'data-nodes-initialized';
const FORCED_MEASURE_ATTR = 'data-forced-measure-ids';
const CALL_SEPARATOR = '|';
const ID_SEPARATOR = '\n';

const useNodesInitialized = () => document.body.getAttribute(NODES_INITIALIZED_ATTR) === 'true';

// One shared function, because the real hook returns a `useCallback(..., [])` — a fresh arrow per
// render would change identity every render and re-fire any effect depending on it, which is the
// exact churn the consumer's effect is written to avoid.
const recordForcedMeasure = (ids) => {
  const recorded = Array.isArray(ids) ? ids.join(ID_SEPARATOR) : String(ids);
  const prior = document.body.getAttribute(FORCED_MEASURE_ATTR);
  document.body.setAttribute(
    FORCED_MEASURE_ATTR,
    prior === null || prior === '' ? recorded : prior + CALL_SEPARATOR + recorded,
  );
};

const useUpdateNodeInternals = () => recordForcedMeasure;

const useReactFlow = jest.fn(() => ({
  getNodes: jest.fn(() => []),
  getEdges: jest.fn(() => []),
  setNodes: jest.fn(),
  setEdges: jest.fn(),
  fitView: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
}));

// Plain function (not jest.fn) so the global auto-reset can't wipe its implementation and
// leave the custom edge's `const [path, labelX, labelY] = getBezierPath(...)` destructure
// reading from undefined.
const getBezierPath = () => ['M0 0', 0, 0, 0, 0];

module.exports = {
  __esModule: true,
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Panel,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  useNodesInitialized,
  useUpdateNodeInternals,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
};
