import React from '#gateway/npm/react';

import { render, screen } from '#gateway/npm/testing-library__react';

import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';

import { FlowEdgeWidget } from './flow-edge-widget';
import { FlowEdgeWidgetProxy } from './flow-edge-widget.proxy';

// The custom edge component is registered with React Flow by type; render it directly with the
// edge geometry props React Flow would supply. The '@xyflow/react' mock stubs BaseEdge,
// EdgeLabelRenderer (renders its children), and getBezierPath, so the HTML label box renders.
const EdgeComponent = FlowEdgeWidget as unknown as React.ComponentType<
  Record<PropertyKey, unknown>
>;

const LONG_LABEL =
  'Yes — earlier failed item with no insertedBy recovery child, so the pipeline halts';

describe('FlowEdgeWidget', () => {
  describe('label rendering', () => {
    it('VALID: {data.label present} => FLOW_EDGE_LABEL shows the FULL untruncated text', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: LONG_LABEL });

      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').textContent).toBe(LONG_LABEL);
    });

    it('VALID: {data.label present} => FLOW_EDGE_LABEL carries a hover title with the full text', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: LONG_LABEL });

      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').getAttribute('title')).toBe(LONG_LABEL);
    });

    it('EMPTY: {no data.label} => no FLOW_EDGE_LABEL rendered', () => {
      FlowEdgeWidgetProxy();

      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.queryByTestId('FLOW_EDGE_LABEL')).toBe(null);
    });
  });

  describe('ELK route rendering', () => {
    it('VALID: {data.route with a bend} => label rides the middle segment of the routed path', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: 'more files' });

      // An L-shaped route (down, then across). midIndex = (3-1)>>1 = 1, so the label sits at the
      // midpoint of segment [pt1 -> pt2] = ((100+100)/2, (0+80)/2) = (100, 40).
      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(100px, 40px\)$/u,
      );
    });

    it('VALID: {straight two-point route} => label sits at that segment midpoint', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: 'yes' });

      // Two points, one segment. midIndex = (2-1)>>1 = 0, midpoint of [pt0 -> pt1] = (30, 0).
      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(30px, 0px\)$/u,
      );
    });

    it('VALID: {no data.route} => label falls back to the geometric bezier midpoint', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: 'no' });

      // No route, so the mock's getBezierPath (labelX = labelY = 0) pins the midpoint at (0, 0).
      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(0px, 0px\)$/u,
      );
    });
  });

  describe('back-edge (loop) rendering', () => {
    it('VALID: {source below target} => drawn as a right-side rectangular loop, label on its vertical run', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: 'more files' });

      // Source (400) sits below target (0), so it is a loop: it arcs out to the right by loop.detour
      // (max(0,0)+60 = 60), giving points [(0,400),(60,400),(60,0),(0,0)]. The label rides the
      // vertical run at x=60, y=(400+0)/2 = 200.
      render({
        ui: React.createElement(EdgeComponent, {
          id: 'loop-1',
          source: 'tail',
          target: 'head',
          sourceX: 0,
          sourceY: 400,
          targetX: 0,
          targetY: 0,
          sourcePosition: 'right',
          targetPosition: 'right',
          data: { label },
        }),
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(60px, 200px\)$/u,
      );
    });
  });

  describe('markerEnd prop', () => {
    it('VALID: {markerEnd provided} => label still renders correctly', () => {
      FlowEdgeWidgetProxy();
      const { label } = FlowEdgeStub({ label: 'yes' });

      render({
        ui: React.createElement(EdgeComponent, {
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
      });

      expect(screen.getByTestId('FLOW_EDGE_LABEL').textContent).toBe(label);
    });
  });
});
