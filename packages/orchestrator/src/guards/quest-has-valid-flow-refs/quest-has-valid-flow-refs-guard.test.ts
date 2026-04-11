import { FlowStub, FlowNodeStub, FlowEdgeStub } from '@dungeonmaster/shared/contracts';

import { questHasValidFlowRefsGuard } from './quest-has-valid-flow-refs-guard';

describe('questHasValidFlowRefsGuard', () => {
  describe('valid references', () => {
    it('VALID: {edges reference existing nodes} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'login-page' }), FlowNodeStub({ id: 'dashboard' })],
          edges: [FlowEdgeStub({ from: 'login-page', to: 'dashboard' })],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {multiple flows all have valid edge refs} => returns true', () => {
      const flows = [
        FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'start' }), FlowNodeStub({ id: 'end' })],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
        FlowStub({
          id: 'signup-flow',
          nodes: [FlowNodeStub({ id: 'form' }), FlowNodeStub({ id: 'success' })],
          edges: [FlowEdgeStub({ from: 'form', to: 'success' })],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {cross-flow ref resolves to existing flow and node} => returns true', () => {
      const flows = [
        FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [
            FlowEdgeStub({
              id: 'cross-edge',
              from: 'login-page',
              to: 'dashboard-flow:dashboard',
            }),
          ],
        }),
        FlowStub({
          id: 'dashboard-flow',
          nodes: [FlowNodeStub({ id: 'dashboard' })],
          edges: [],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questHasValidFlowRefsGuard({ flows: [] });

      expect(result).toBe(true);
    });

    it('VALID: {flow with empty edges} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(true);
    });
  });

  describe('invalid references', () => {
    it('INVALID: {edge from references non-existent node} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'dashboard' })],
          edges: [FlowEdgeStub({ from: 'non-existent', to: 'dashboard' })],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {edge to references non-existent node} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [FlowEdgeStub({ from: 'login-page', to: 'non-existent' })],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {both from and to reference non-existent nodes} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [FlowEdgeStub({ from: 'missing-from', to: 'missing-to' })],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {cross-flow ref targets non-existent flow} => returns false', () => {
      const flows = [
        FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [
            FlowEdgeStub({
              id: 'bad-cross',
              from: 'login-page',
              to: 'nonexistent-flow:dashboard',
            }),
          ],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {cross-flow ref targets non-existent node in existing flow} => returns false', () => {
      const flows = [
        FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [
            FlowEdgeStub({
              id: 'bad-node',
              from: 'login-page',
              to: 'dashboard-flow:missing-node',
            }),
          ],
        }),
        FlowStub({
          id: 'dashboard-flow',
          nodes: [FlowNodeStub({ id: 'dashboard' })],
          edges: [],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questHasValidFlowRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
