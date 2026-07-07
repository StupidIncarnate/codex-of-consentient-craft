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

  describe('skip-layer label positioning', () => {
    it('VALID: {edge spans multiple layers (large vertical drop)} => label anchors in the inter-layer gap below the source, not the geometric midpoint', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'yes' });

      // A reconverging "yes" branch: from the decision (source) straight down to a node two
      // layers below (target), diagonally offset. The geometric midpoint (labelX/labelY from
      // getBezierPath) would land on the intervening card; the label must instead sit in the
      // clear gap just below the source. Drop = 400 > one layer, so the skip-layer rule fires:
      // labelY = sourceY + nodeNodeBetweenLayers/2 (70); labelX interpolated at 70/400 = 0.175.
      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'decision',
          target: 'reconverge',
          sourceX: 0,
          sourceY: 0,
          targetX: 400,
          targetY: 400,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: { label },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(70px, 70px\)$/u,
      );
    });

    it('VALID: {short adjacent-layer edge} => label stays at the geometric midpoint', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'no' });

      // Drop = 40 (well under one layer), so the midpoint is kept. The mock's getBezierPath
      // returns labelX = labelY = 0, so the transform pins the geometric midpoint (0, 0).
      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'decision',
          target: 'branch',
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

  describe('sibling label spreading', () => {
    it('VALID: {data.labelOffsetX present} => label anchors at midpoint+offset in the fork-row gap', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'loads ok' });

      // The widget's flowBranchLabelOffsetsTransformer supplies a +90px horizontal offset to push
      // this label off its crowded sibling. The label sits at the mocked midpoint (0) + 90, on the
      // aligned fork row (sourceY 0 + skipLayerDrop 70). The offset wins even though this short
      // edge is not itself a skip.
      render(
        React.createElement(EdgeComponent, {
          id: 'edge-1',
          source: 'decision',
          target: 'branch',
          sourceX: 0,
          sourceY: 0,
          targetX: 20,
          targetY: 40,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: { label, labelOffsetX: 90 },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(90px, 70px\)$/u,
      );
    });
  });

  describe('loop (back-edge) routing', () => {
    it('VALID: {target sits far above source} => label rides the side-detour arc, not the straight midpoint', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'more files' });

      // A back-edge: target is 400px ABOVE the source (> one layer), so it is bowed out to the side
      // (detourX = max(sourceX, targetX) + loop.detour = 0 + 240) instead of drawn straight up
      // through the stack. The label sits on that arc at its vertical midpoint (400+0)/2 = 200.
      render(
        React.createElement(EdgeComponent, {
          id: 'loop-1',
          source: 'tail',
          target: 'head',
          sourceX: 0,
          sourceY: 400,
          targetX: 0,
          targetY: 0,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: { label },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(240px, 200px\)$/u,
      );
    });

    it('VALID: {back-edge that also carries a sibling offset} => loop routing wins (offset ignored)', () => {
      xyflowEdgeAdapterProxy();
      const { label } = FlowEdgeStub({ label: 'retry' });

      // Even with a labelOffsetX present, a back-edge takes the loop path — the label stays on the
      // detour arc (240, 200) rather than being pulled to midpoint+offset in the fork row.
      render(
        React.createElement(EdgeComponent, {
          id: 'loop-2',
          source: 'tail',
          target: 'head',
          sourceX: 0,
          sourceY: 400,
          targetX: 0,
          targetY: 0,
          sourcePosition: 'bottom',
          targetPosition: 'top',
          data: { label, labelOffsetX: 90 },
        }),
      );

      expect(screen.getByTestId('FLOW_EDGE_LABEL').style.transform).toMatch(
        /^translate\(-50%, -50%\) translate\(240px, 200px\)$/u,
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
