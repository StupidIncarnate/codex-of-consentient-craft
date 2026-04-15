import { FlowEdgeStub, FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questOrphanFlowNodesTransformer } from './quest-orphan-flow-nodes-transformer';

describe('questOrphanFlowNodesTransformer', () => {
  describe('no orphans', () => {
    it('VALID: {all connected} => returns []', () => {
      const nodeA = FlowNodeStub({ id: 'a' as never });
      const nodeB = FlowNodeStub({ id: 'b' as never });
      const edge = FlowEdgeStub({ id: 'e1' as never, from: 'a' as never, to: 'b' as never });
      const flow = FlowStub({ nodes: [nodeA, nodeB], edges: [edge] });

      const result = questOrphanFlowNodesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('orphans present', () => {
    it('INVALID: {node not in any edge} => returns description', () => {
      const connectedNode = FlowNodeStub({ id: 'connected' as never });
      const orphanNode = FlowNodeStub({ id: 'orphan' as never, label: 'Orphan' as never });
      const edge = FlowEdgeStub({
        id: 'e1' as never,
        from: 'connected' as never,
        to: 'connected' as never,
      });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [connectedNode, orphanNode],
        edges: [edge],
      });

      const result = questOrphanFlowNodesTransformer({ flows: [flow] });

      expect(result).toStrictEqual(["flow 'login-flow' has orphan node 'orphan'"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questOrphanFlowNodesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
