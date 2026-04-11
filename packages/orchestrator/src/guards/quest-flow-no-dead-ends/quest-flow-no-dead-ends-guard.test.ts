import {
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowNodeIdStub,
} from '@dungeonmaster/shared/contracts';

import { questFlowNoDeadEndsGuard } from './quest-flow-no-dead-ends-guard';

describe('questFlowNoDeadEndsGuard', () => {
  describe('valid flows', () => {
    it('VALID: {non-terminal node with outgoing edge} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'dashboard' }), type: 'terminal' }),
          ],
          edges: [FlowEdgeStub({ from: 'login-page', to: 'dashboard' })],
        }),
      ];

      const result = questFlowNoDeadEndsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {terminal node with no outgoing edges} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'start' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'end' }), type: 'terminal' }),
          ],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
      ];

      const result = questFlowNoDeadEndsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questFlowNoDeadEndsGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('dead-end non-terminal nodes', () => {
    it('INVALID: {state node with no outgoing edges} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: FlowNodeIdStub({ value: 'orphan' }), type: 'state' })],
          edges: [],
        }),
      ];

      const result = questFlowNoDeadEndsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {action node only appears in edge to-fields} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'start' }), type: 'state' }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'process' }), type: 'action' }),
          ],
          edges: [FlowEdgeStub({ from: 'start', to: 'process' })],
        }),
      ];

      const result = questFlowNoDeadEndsGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowNoDeadEndsGuard({});

      expect(result).toBe(false);
    });
  });
});
