import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questUnresolvedFlowRefsTransformer } from './quest-unresolved-flow-refs-transformer';

describe('questUnresolvedFlowRefsTransformer', () => {
  describe('all resolved', () => {
    it('VALID: {all edges resolve} => returns []', () => {
      const node = FlowNodeStub({ id: 'n1' });
      const flow = FlowStub({
        nodes: [node],
        edges: [FlowEdgeStub({ id: 'e1', from: 'n1', to: 'n1' })],
      });

      const result = questUnresolvedFlowRefsTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unresolved refs', () => {
    it('INVALID: {edge points to nonexistent node} => returns description', () => {
      const node = FlowNodeStub({ id: 'node-a' });
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [node],
        edges: [FlowEdgeStub({ id: 'e1', from: 'node-a', to: 'ghost' })],
      });

      const result = questUnresolvedFlowRefsTransformer({ flows: [flow] });

      expect(result).toStrictEqual(["flow 'login-flow' edge 'e1' has unresolved 'to' ref 'ghost'"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questUnresolvedFlowRefsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
