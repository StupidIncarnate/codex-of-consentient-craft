import React from 'react';

import { render, screen } from '@testing-library/react';

import { FlowEdgeStub } from '@dungeonmaster/shared/contracts';

import { xyflowEdgeAdapter } from './xyflow-edge-adapter';
import { xyflowEdgeAdapterProxy } from './xyflow-edge-adapter.proxy';

// The custom edge component is registered with React Flow by type; render it directly with the
// edge geometry props React Flow would supply. The '@xyflow/react' mock stubs BaseEdge,
// EdgeLabelRenderer (renders its children), and getBezierPath, so the HTML label box renders.
const EdgeComponent = xyflowEdgeAdapter as unknown as React.ComponentType<
  Record<PropertyKey, unknown>
>;

const LONG_LABEL =
  'Yes — earlier failed item with no insertedBy recovery child, so the pipeline halts';

describe('xyflowEdgeAdapter', () => {
  describe('label rendering', () => {
    it('VALID: {data.label present} => FLOW_EDGE_LABEL shows the FULL untruncated text', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: LONG_LABEL });

      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'node-a',
          target: 'node-b',
          sourceX: 0,
          sourceY: 0,
          targetX: 20,
          targetY: 40,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: { label },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').textContent).toBe(LONG_LABEL);
    });

    it('VALID: {data.label present} => FLOW_EDGE_LABEL carries a hover title with the full text', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: LONG_LABEL });

      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'node-a',
          target: 'node-b',
          sourceX: 0,
          sourceY: 0,
          targetX: 20,
          targetY: 40,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: { label },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').getAttribute('title')).toBe(LONG_LABEL);
    });

    it('EMPTY: {no data.label} => no FLOW_EDGE_LABEL rendered', () => {
      xyflowEdgeAdapterProxy();

      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'node-a',
          target: 'node-b',
          sourceX: 0,
          sourceY: 0,
          targetX: 20,
          targetY: 40,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: {},
        }),
      );

      expect(screen.queryByTestId('FLOW_EDGE_LABEL')).toBe(null);
    });
  });
});
