import { FlowEdgeStub, FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDecisionEdgesMissingLabelTransformer } from './quest-decision-edges-missing-label-transformer';

describe('questDecisionEdgesMissingLabelTransformer', () => {
  describe('all labeled', () => {
    it('VALID: {decision edges have labels} => returns []', () => {
      const decision = FlowNodeStub({ id: 'decide' as never, type: 'decision' });
      const target = FlowNodeStub({ id: 'target' as never });
      const edge = FlowEdgeStub({
        id: 'e1' as never,
        from: 'decide' as never,
        to: 'target' as never,
        label: 'yes' as never,
      });
      const flow = FlowStub({ nodes: [decision, target], edges: [edge] });

      const result = questDecisionEdgesMissingLabelTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing label', () => {
    it('INVALID: {decision edge has no label} => returns description', () => {
      const decision = FlowNodeStub({ id: 'check-auth' as never, type: 'decision' });
      const target = FlowNodeStub({ id: 'done' as never });
      const edge = FlowEdgeStub({
        id: 'unlabeled' as never,
        from: 'check-auth' as never,
        to: 'done' as never,
      });
      Reflect.deleteProperty(edge, 'label');
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [decision, target],
        edges: [edge],
      });

      const result = questDecisionEdgesMissingLabelTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        "flow 'login-flow' edge 'unlabeled' from decision 'check-auth' has no label",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDecisionEdgesMissingLabelTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
