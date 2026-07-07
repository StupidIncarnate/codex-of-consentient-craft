import { FlowEdgeStub, FlowNodeStub } from '@dungeonmaster/shared/contracts';

import { ElkPositionMapStub } from '../../../contracts/elk-position-map/elk-position-map.stub';
import { FlowEdgeRouteMapStub } from '../../../contracts/flow-edge-route-map/flow-edge-route-map.stub';
import { FlowPortalNodeDataStub } from '../../../contracts/flow-portal-node-data/flow-portal-node-data.stub';
import { elkLayoutAdapter } from './elk-layout-adapter';
import { elkLayoutAdapterProxy } from './elk-layout-adapter.proxy';

describe('elkLayoutAdapter', () => {
  describe('valid layouts', () => {
    it('VALID: {2 nodes, 1 edge} => returns position map with exactly 2 entries', async () => {
      const proxy = elkLayoutAdapterProxy();
      const nodeA = FlowNodeStub({ id: 'login-page' });
      const nodeB = FlowNodeStub({ id: 'dashboard' });
      const edge = FlowEdgeStub({ id: 'login-to-dashboard', from: 'login-page', to: 'dashboard' });

      proxy.returnsPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 0, y: 120 },
        ],
      });

      const result = await elkLayoutAdapter({ nodes: [nodeA, nodeB], edges: [edge] });

      expect(result.positions).toStrictEqual(
        ElkPositionMapStub({
          'login-page': { x: 0, y: 0 },
          dashboard: { x: 0, y: 120 },
        }),
      );
    });

    it('VALID: {ELK returns edge sections} => routes flatten each section into start, bends, end', async () => {
      const proxy = elkLayoutAdapterProxy();
      const nodeA = FlowNodeStub({ id: 'login-page' });
      const nodeB = FlowNodeStub({ id: 'dashboard' });
      const edge = FlowEdgeStub({ id: 'login-to-dashboard', from: 'login-page', to: 'dashboard' });

      proxy.returnsPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 0, y: 120 },
        ],
        edges: [
          {
            id: 'login-to-dashboard',
            sections: [
              {
                startPoint: { x: 0, y: 40 },
                bendPoints: [{ x: 0, y: 80 }],
                endPoint: { x: 60, y: 120 },
              },
            ],
          },
        ],
      });

      const result = await elkLayoutAdapter({ nodes: [nodeA, nodeB], edges: [edge] });

      expect(result.routes).toStrictEqual(
        FlowEdgeRouteMapStub({
          'login-to-dashboard': [
            { x: 0, y: 40 },
            { x: 0, y: 80 },
            { x: 60, y: 120 },
          ],
        }),
      );
    });

    it('EMPTY: {no edges in ELK result} => routes is an empty map', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result.routes).toStrictEqual(FlowEdgeRouteMapStub({}));
    });

    it('VALID: {1 node, x=45, y=90} => returned position has exact numeric x and y', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsPositions({
        children: [{ id: 'login-page', x: 45, y: 90 }],
      });

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result.positions).toStrictEqual(
        ElkPositionMapStub({ 'login-page': { x: 45, y: 90 } }),
      );
    });

    it('EMPTY: {0 nodes, 0 edges} => returns empty position map', async () => {
      const proxy = elkLayoutAdapterProxy();

      proxy.returnsPositions({ children: [] });

      const result = await elkLayoutAdapter({ nodes: [], edges: [] });

      expect(result.positions).toStrictEqual(ElkPositionMapStub({}));
    });

    it('EDGE: {ELK result has no children field} => returns empty position map', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsNoChildren();

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result.positions).toStrictEqual(ElkPositionMapStub({}));
    });

    it('VALID: {cross-flow edge + portal} => portal reference is added as a graph child so ELK resolves the edge', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'run-compile' });
      const crossEdge = FlowEdgeStub({
        id: 'invokes',
        from: 'run-compile',
        to: 'compile-flow:compile-entry',
        label: 'invokes',
      });
      const portal = FlowPortalNodeDataStub({
        reference: 'compile-flow:compile-entry',
        label: '↗ compile-flow → compile-entry',
      });

      proxy.returnsPositions({
        children: [
          { id: 'run-compile', x: 0, y: 0 },
          { id: 'compile-flow:compile-entry', x: 0, y: 200 },
        ],
      });

      const result = await elkLayoutAdapter({
        nodes: [node],
        edges: [crossEdge],
        portals: [portal],
      });

      // The portal id must be a graph child — otherwise real ELK throws on the unresolvable
      // edge target (the crash this fix repairs).
      expect(proxy.getGraphChildIds()).toStrictEqual(['run-compile', 'compile-flow:compile-entry']);
      expect(result.positions).toStrictEqual(
        ElkPositionMapStub({
          'run-compile': { x: 0, y: 0 },
          'compile-flow:compile-entry': { x: 0, y: 200 },
        }),
      );
    });

    it('EDGE: {child has undefined x and y} => position defaults to {x: 0, y: 0}', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsPositions({ children: [{ id: 'login-page' }] });

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result.positions).toStrictEqual(ElkPositionMapStub({ 'login-page': { x: 0, y: 0 } }));
    });
  });

  describe('error cases', () => {
    it('ERROR: {layout throws} => adapter rejects with the same error', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });
      const error = new Error('ELK layout failed');

      proxy.throws({ error });

      await expect(elkLayoutAdapter({ nodes: [node], edges: [] })).rejects.toThrow(
        /ELK layout failed/u,
      );
    });
  });
});
