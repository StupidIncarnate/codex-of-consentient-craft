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

const useReactFlow = jest.fn(() => ({
  getNodes: jest.fn(() => []),
  getEdges: jest.fn(() => []),
  setNodes: jest.fn(),
  setEdges: jest.fn(),
  fitView: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
}));

const getBezierPath = jest.fn(() => ['M0 0', 0, 0, 0, 0]);

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
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
};
