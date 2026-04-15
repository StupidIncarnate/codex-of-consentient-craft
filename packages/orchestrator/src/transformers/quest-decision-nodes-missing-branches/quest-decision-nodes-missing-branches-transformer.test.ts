import { FlowEdgeStub, FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDecisionNodesMissingBranchesTransformer } from './quest-decision-nodes-missing-branches-transformer';

describe('questDecisionNodesMissingBranchesTransformer', () => {
  describe('sufficient branches', () => {
    it('VALID: {decision has 2 outgoing edges} => returns []', () => {
      const decision = FlowNodeStub({ id: 'decide' as never, type: 'decision' });
      const a = FlowNodeStub({ id: 'a' as never });
      const b = FlowNodeStub({ id: 'b' as never });
      const edge1 = FlowEdgeStub({
        id: 'e1' as never,
        from: 'decide' as never,
        to: 'a' as never,
        label: 'yes' as never,
      });
      const edge2 = FlowEdgeStub({
        id: 'e2' as never,
        from: 'decide' as never,
        to: 'b' as never,
        label: 'no' as never,
      });
      const flow = FlowStub({ nodes: [decision, a, b], edges: [edge1, edge2] });

      const result = questDecisionNodesMissingBranchesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing branches', () => {
    it('INVALID: {decision has 1 outgoing edge} => returns description', () => {
      const decision = FlowNodeStub({ id: 'check-auth' as never, type: 'decision' });
      const target = FlowNodeStub({ id: 'done' as never });
      const edge = FlowEdgeStub({
        id: 'e1' as never,
        from: 'check-auth' as never,
        to: 'done' as never,
      });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [decision, target],
        edges: [edge],
      });

      const result = questDecisionNodesMissingBranchesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        "flow 'login-flow' decision 'check-auth' has 1 outgoing edges (need ≥2)",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDecisionNodesMissingBranchesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
