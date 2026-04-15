import { FlowEdgeStub, FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDeadEndFlowNodesTransformer } from './quest-dead-end-flow-nodes-transformer';

describe('questDeadEndFlowNodesTransformer', () => {
  describe('no dead ends', () => {
    it('VALID: {all non-terminal nodes have outgoing edges} => returns []', () => {
      const nodeA = FlowNodeStub({ id: 'a' as never, type: 'state' });
      const nodeB = FlowNodeStub({ id: 'b' as never, type: 'terminal' });
      const edge = FlowEdgeStub({ id: 'e1' as never, from: 'a' as never, to: 'b' as never });
      const flow = FlowStub({ nodes: [nodeA, nodeB], edges: [edge] });

      const result = questDeadEndFlowNodesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('dead end present', () => {
    it('INVALID: {non-terminal node has no outgoing edge} => returns description', () => {
      const stuck = FlowNodeStub({ id: 'stuck' as never, type: 'state' });
      const other = FlowNodeStub({ id: 'other' as never, type: 'state' });
      const edgeIncoming = FlowEdgeStub({
        id: 'e1' as never,
        from: 'other' as never,
        to: 'stuck' as never,
      });
      const selfEdge = FlowEdgeStub({
        id: 'e2' as never,
        from: 'other' as never,
        to: 'other' as never,
      });
      const flow = FlowStub({
        id: 'login-flow' as never,
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
