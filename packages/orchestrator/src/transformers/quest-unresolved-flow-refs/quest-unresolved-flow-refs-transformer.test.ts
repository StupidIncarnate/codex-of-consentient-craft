import { FlowEdgeStub, FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questUnresolvedFlowRefsTransformer } from './quest-unresolved-flow-refs-transformer';

describe('questUnresolvedFlowRefsTransformer', () => {
  describe('all resolved', () => {
    it('VALID: {all edges resolve} => returns []', () => {
      const node = FlowNodeStub({ id: 'n1' as never });
      const flow = FlowStub({
        nodes: [node],
        edges: [FlowEdgeStub({ id: 'e1' as never, from: 'n1' as never, to: 'n1' as never })],
      });

      const result = questUnresolvedFlowRefsTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unresolved refs', () => {
    it('INVALID: {edge points to nonexistent node} => returns description', () => {
      const node = FlowNodeStub({ id: 'node-a' as never });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [node],
        edges: [FlowEdgeStub({ id: 'e1' as never, from: 'node-a' as never, to: 'ghost' as never })],
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
