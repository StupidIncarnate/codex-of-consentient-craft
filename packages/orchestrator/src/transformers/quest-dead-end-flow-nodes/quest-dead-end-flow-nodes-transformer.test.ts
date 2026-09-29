import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDeadEndFlowNodesTransformer } from './quest-dead-end-flow-nodes-transformer';

describe('questDeadEndFlowNodesTransformer', () => {
  describe('no dead ends', () => {
    it('VALID: {all non-terminal nodes have outgoing edges} => returns []', () => {
      const nodeA = FlowNodeStub({ id: 'a', type: 'state' });
      const nodeB = FlowNodeStub({ id: 'b', type: 'terminal' });
      const edge = FlowEdgeStub({ id: 'e1', from: 'a', to: 'b' });
      const flow = FlowStub({ nodes: [nodeA, nodeB], edges: [edge] });

      const result = questDeadEndFlowNodesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('dead end present', () => {
    it('INVALID: {non-terminal node has no outgoing edge} => returns description', () => {
      const stuck = FlowNodeStub({ id: 'stuck', type: 'state' });
      const other = FlowNodeStub({ id: 'other', type: 'state' });
      const edgeIncoming = FlowEdgeStub({
        id: 'e1',
        from: 'other',
        to: 'stuck',
      });
      const selfEdge = FlowEdgeStub({
        id: 'e2',
        from: 'other',
        to: 'other',
      });
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [stuck, other],
        edges: [edgeIncoming, selfEdge],
      });

      const result = questDeadEndFlowNodesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        "flow 'login-flow' node 'stuck' (type state) has no outgoing edge",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDeadEndFlowNodesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
