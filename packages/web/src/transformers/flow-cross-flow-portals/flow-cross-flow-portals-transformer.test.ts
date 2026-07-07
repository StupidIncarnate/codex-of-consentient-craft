import { FlowEdgeStub, FlowNodeStub } from '@dungeonmaster/shared/contracts';

import { flowCrossFlowPortalsTransformer } from './flow-cross-flow-portals-transformer';

describe('flowCrossFlowPortalsTransformer', () => {
  describe('all-local edges', () => {
    it('EMPTY: {every edge endpoint is a local node} => returns no portals', () => {
      const nodeA = FlowNodeStub({ id: 'run-compile' });
      const nodeB = FlowNodeStub({ id: 'dispatch-cmd' });
      const edge = FlowEdgeStub({ id: 'a-to-b', from: 'run-compile', to: 'dispatch-cmd' });

      const result = flowCrossFlowPortalsTransformer({ nodes: [nodeA, nodeB], edges: [edge] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('cross-flow edges', () => {
    it('VALID: {edge targets flowId:nodeId in another flow} => returns one portal with a hand-off label', () => {
      const node = FlowNodeStub({ id: 'run-compile' });
      const crossEdge = FlowEdgeStub({
        id: 'invokes',
        from: 'run-compile',
        to: 'compile-flow:compile-entry',
        label: 'invokes',
      });

      const result = flowCrossFlowPortalsTransformer({ nodes: [node], edges: [crossEdge] });

      expect(result).toStrictEqual([
        { reference: 'compile-flow:compile-entry', label: '↗ compile-flow → compile-entry' },
      ]);
    });

    it('VALID: {two edges target the same off-flow node} => dedupes to a single portal', () => {
      const nodeA = FlowNodeStub({ id: 'run-compile' });
      const nodeB = FlowNodeStub({ id: 'retry-compile' });
      const edge1 = FlowEdgeStub({
        id: 'e1',
        from: 'run-compile',
        to: 'compile-flow:compile-entry',
      });
      const edge2 = FlowEdgeStub({
        id: 'e2',
        from: 'retry-compile',
        to: 'compile-flow:compile-entry',
      });

      const result = flowCrossFlowPortalsTransformer({
        nodes: [nodeA, nodeB],
        edges: [edge1, edge2],
      });

      expect(result).toStrictEqual([
        { reference: 'compile-flow:compile-entry', label: '↗ compile-flow → compile-entry' },
      ]);
    });

    it('VALID: {edge source is off-flow} => returns a portal for the source endpoint too', () => {
      const node = FlowNodeStub({ id: 'compile-entry' });
      const crossEdge = FlowEdgeStub({
        id: 'from-cli',
        from: 'cli-precheck:run-compile',
        to: 'compile-entry',
      });

      const result = flowCrossFlowPortalsTransformer({ nodes: [node], edges: [crossEdge] });

      expect(result).toStrictEqual([
        { reference: 'cli-precheck:run-compile', label: '↗ cli-precheck → run-compile' },
      ]);
    });
  });
});
