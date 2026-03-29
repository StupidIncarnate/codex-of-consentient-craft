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
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          nodes: [FlowNodeStub({ id: 'start' }), FlowNodeStub({ id: 'end' })],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
        FlowStub({
          id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
          nodes: [FlowNodeStub({ id: 'form' }), FlowNodeStub({ id: 'success' })],
          edges: [FlowEdgeStub({ from: 'form', to: 'success' })],
        }),
      ];

      const result = questHasValidFlowRefsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {cross-flow refs containing colon} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'login-page' })],
          edges: [
            FlowEdgeStub({
              from: 'login-page',
              to: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e:dashboard',
            }),
          ],
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
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questHasValidFlowRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
