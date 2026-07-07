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

  describe('ELK route rendering', () => {
    it('VALID: {data.route with a bend} => label rides the middle segment of the routed path', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'more files' });

      // An L-shaped route (down, then across). midIndex = (3-1)>>1 = 1, so the label sits at the
      // midpoint of segment [pt1 -> pt2] = ((100+100)/2, (0+80)/2) = (100, 40).
      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'node-a',
          target: 'node-b',
          sourceX: 0,
          sourceY: 0,
          targetX: 100,
          targetY: 80,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: {
            label,
            route: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 80 },
            ],
          },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(100px, 40px\)$/u,
      );
    });

    it('VALID: {straight two-point route} => label sits at that segment midpoint', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'yes' });

      // Two points, one segment. midIndex = (2-1)>>1 = 0, midpoint of [pt0 -> pt1] = (30, 0).
      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'node-a',
          target: 'node-b',
          sourceX: 0,
          sourceY: 0,
          targetX: 60,
          targetY: 0,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: {
            label,
            route: [
              { x: 0, y: 0 },
              { x: 60, y: 0 },
            ],
          },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(30px, 0px\)$/u,
      );
    });

    it('VALID: {no data.route} => label falls back to the geometric bezier midpoint', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'no' });

      // No route, so the mock's getBezierPath (labelX = labelY = 0) pins the midpoint at (0, 0).
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

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(0px, 0px\)$/u,
      );
    });
  });

  describe('markerEnd prop', () => {
    it('VALID: {markerEnd provided} => label still renders correctly', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'yes' });

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
          markerEnd: 'url(#arrowclosed)',
          data: { label },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').textContent).toBe(label);
    });
  });
});
