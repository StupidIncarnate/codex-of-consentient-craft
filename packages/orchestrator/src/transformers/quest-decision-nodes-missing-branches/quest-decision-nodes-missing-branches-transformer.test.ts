import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDecisionNodesMissingBranchesTransformer } from './quest-decision-nodes-missing-branches-transformer';

describe('questDecisionNodesMissingBranchesTransformer', () => {
  describe('sufficient branches', () => {
    it('VALID: {decision has 2 outgoing edges} => returns []', () => {
      const decision = FlowNodeStub({ id: 'decide', type: 'decision' });
      const a = FlowNodeStub({ id: 'a' });
      const b = FlowNodeStub({ id: 'b' });
      const edge1 = FlowEdgeStub({
        id: 'e1',
        from: 'decide',
        to: 'a',
        label: 'yes',
      });
      const edge2 = FlowEdgeStub({
        id: 'e2',
        from: 'decide',
        to: 'b',
        label: 'no',
      });
      const flow = FlowStub({ nodes: [decision, a, b], edges: [edge1, edge2] });

      const result = questDecisionNodesMissingBranchesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing branches', () => {
    it('INVALID: {decision has 1 outgoing edge} => returns description', () => {
      const decision = FlowNodeStub({ id: 'check-auth', type: 'decision' });
      const target = FlowNodeStub({ id: 'done' });
      const edge = FlowEdgeStub({
        id: 'e1',
        from: 'check-auth',
        to: 'done',
      });
      const flow = FlowStub({
        id: 'login-flow',
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
