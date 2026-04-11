import {
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowNodeIdStub,
} from '@dungeonmaster/shared/contracts';

import { questFlowDecisionHasBranchesGuard } from './quest-flow-decision-has-branches-guard';

describe('questFlowDecisionHasBranchesGuard', () => {
  describe('valid decision nodes', () => {
    it('VALID: {decision node with 2 outgoing edges} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'decide' }), type: 'decision' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'yes-path' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'no-path' }), type: 'state' }),
          ],
          edges: [
            FlowEdgeStub({ id: 'to-yes', from: 'decide', to: 'yes-path' }),
            FlowEdgeStub({ id: 'to-no', from: 'decide', to: 'no-path' }),
          ],
        }),
      ];

      const result = questFlowDecisionHasBranchesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {decision node with 3 outgoing edges} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'decide' }), type: 'decision' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'a-path' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'b-path' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'c-path' }), type: 'state' }),
          ],
          edges: [
            FlowEdgeStub({ id: 'to-a', from: 'decide', to: 'a-path' }),
            FlowEdgeStub({ id: 'to-b', from: 'decide', to: 'b-path' }),
            FlowEdgeStub({ id: 'to-c', from: 'decide', to: 'c-path' }),
          ],
        }),
      ];

      const result = questFlowDecisionHasBranchesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {flow with no decision nodes} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: FlowNodeIdStub({ value: 'state-only' }), type: 'state' })],
          edges: [],
        }),
      ];

      const result = questFlowDecisionHasBranchesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questFlowDecisionHasBranchesGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('invalid decision nodes', () => {
    it('INVALID: {decision node with only 1 outgoing edge} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'decide' }), type: 'decision' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'only-path' }), type: 'state' }),
          ],
          edges: [FlowEdgeStub({ id: 'to-only', from: 'decide', to: 'only-path' })],
        }),
      ];

      const result = questFlowDecisionHasBranchesGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {decision node with 0 outgoing edges} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'orphan-decide' }), type: 'decision' }),
          ],
          edges: [],
        }),
      ];

      const result = questFlowDecisionHasBranchesGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowDecisionHasBranchesGuard({});

      expect(result).toBe(false);
    });
  });
});
