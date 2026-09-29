import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questOrphanFlowNodesTransformer } from './quest-orphan-flow-nodes-transformer';

describe('questOrphanFlowNodesTransformer', () => {
  describe('no orphans', () => {
    it('VALID: {all connected} => returns []', () => {
      const nodeA = FlowNodeStub({ id: 'a' });
      const nodeB = FlowNodeStub({ id: 'b' });
      const edge = FlowEdgeStub({ id: 'e1', from: 'a', to: 'b' });
      const flow = FlowStub({ nodes: [nodeA, nodeB], edges: [edge] });

      const result = questOrphanFlowNodesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('orphans present', () => {
    it('INVALID: {node not in any edge} => returns description', () => {
      const connectedNode = FlowNodeStub({ id: 'connected' });
      const orphanNode = FlowNodeStub({ id: 'orphan', label: 'Orphan' });
      const edge = FlowEdgeStub({
        id: 'e1',
        from: 'connected',
        to: 'connected',
      });
      const flow = FlowStub({
        id: 'login-flow',
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
