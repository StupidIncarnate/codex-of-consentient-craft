import { FlowEdgeStub, FlowNodeStub } from '@dungeonmaster/shared/contracts';

import { ElkPositionMapStub } from '../../../contracts/elk-position-map/elk-position-map.stub';
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

      expect(result).toStrictEqual(
        ElkPositionMapStub({
          'login-page': { x: 0, y: 0 },
          dashboard: { x: 0, y: 120 },
        }),
      );
    });

    it('VALID: {1 node, x=45, y=90} => returned position has exact numeric x and y', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsPositions({
        children: [{ id: 'login-page', x: 45, y: 90 }],
      });

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result).toStrictEqual(ElkPositionMapStub({ 'login-page': { x: 45, y: 90 } }));
    });

    it('EMPTY: {0 nodes, 0 edges} => returns empty position map', async () => {
      const proxy = elkLayoutAdapterProxy();

      proxy.returnsPositions({ children: [] });

      const result = await elkLayoutAdapter({ nodes: [], edges: [] });

      expect(result).toStrictEqual(ElkPositionMapStub({}));
    });

    it('EDGE: {ELK result has no children field} => returns empty position map', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsNoChildren();

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result).toStrictEqual(ElkPositionMapStub({}));
    });

    it('EDGE: {child has undefined x and y} => position defaults to {x: 0, y: 0}', async () => {
      const proxy = elkLayoutAdapterProxy();
      const node = FlowNodeStub({ id: 'login-page' });

      proxy.returnsPositions({ children: [{ id: 'login-page' }] });

      const result = await elkLayoutAdapter({ nodes: [node], edges: [] });

      expect(result).toStrictEqual(ElkPositionMapStub({ 'login-page': { x: 0, y: 0 } }));
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
