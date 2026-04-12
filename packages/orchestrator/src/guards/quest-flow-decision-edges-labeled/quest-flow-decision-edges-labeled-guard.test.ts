import {
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowNodeIdStub,
} from '@dungeonmaster/shared/contracts';

import { questFlowDecisionEdgesLabeledGuard } from './quest-flow-decision-edges-labeled-guard';

describe('questFlowDecisionEdgesLabeledGuard', () => {
  describe('valid labels', () => {
    it('VALID: {all edges from decision have labels} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'decide' }), type: 'decision' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'yes-path' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'no-path' }), type: 'state' }),
          ],
          edges: [
            FlowEdgeStub({ id: 'to-yes', from: 'decide', to: 'yes-path', label: 'yes' }),
            FlowEdgeStub({ id: 'to-no', from: 'decide', to: 'no-path', label: 'no' }),
          ],
        }),
      ];

      const result = questFlowDecisionEdgesLabeledGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {edges from state nodes without labels} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'start' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'end' }), type: 'state' }),
          ],
          edges: [FlowEdgeStub({ id: 'start-to-end', from: 'start', to: 'end' })],
        }),
      ];

      const result = questFlowDecisionEdgesLabeledGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questFlowDecisionEdgesLabeledGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('missing labels', () => {
    it('INVALID: {edge from decision missing label} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'decide' }), type: 'decision' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'yes-path' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'no-path' }), type: 'state' }),
          ],
          edges: [
            FlowEdgeStub({ id: 'to-yes', from: 'decide', to: 'yes-path', label: 'yes' }),
            FlowEdgeStub({ id: 'to-no', from: 'decide', to: 'no-path' }),
          ],
        }),
      ];

      const result = questFlowDecisionEdgesLabeledGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {decision edge with label: ""} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'decide' }), type: 'decision' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'yes-path' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'no-path' }), type: 'state' }),
          ],
          edges: [
            FlowEdgeStub({ id: 'to-yes', from: 'decide', to: 'yes-path', label: 'yes' }),
            FlowEdgeStub({ id: 'to-no', from: 'decide', to: 'no-path', label: '' }),
          ],
        }),
      ];

      const result = questFlowDecisionEdgesLabeledGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowDecisionEdgesLabeledGuard({});

      expect(result).toBe(false);
    });
  });
});
