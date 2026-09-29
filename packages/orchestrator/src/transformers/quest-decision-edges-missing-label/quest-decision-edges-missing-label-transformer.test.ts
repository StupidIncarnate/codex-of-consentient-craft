import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDecisionEdgesMissingLabelTransformer } from './quest-decision-edges-missing-label-transformer';

describe('questDecisionEdgesMissingLabelTransformer', () => {
  describe('all labeled', () => {
    it('VALID: {decision edges have labels} => returns []', () => {
      const decision = FlowNodeStub({ id: 'decide', type: 'decision' });
      const target = FlowNodeStub({ id: 'target' });
      const edge = FlowEdgeStub({
        id: 'e1',
        from: 'decide',
        to: 'target',
        label: 'yes',
      });
      const flow = FlowStub({ nodes: [decision, target], edges: [edge] });

      const result = questDecisionEdgesMissingLabelTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing label', () => {
    it('INVALID: {decision edge has no label} => returns description', () => {
      const decision = FlowNodeStub({ id: 'check-auth', type: 'decision' });
      const target = FlowNodeStub({ id: 'done' });
      const edge = FlowEdgeStub({
        id: 'unlabeled',
        from: 'check-auth',
        to: 'done',
      });
      Reflect.deleteProperty(edge, 'label');
      const flow = FlowStub({
        id: 'login-flow',
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
