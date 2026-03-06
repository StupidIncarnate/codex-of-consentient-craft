import { FlowStub, FlowNodeStub, FlowEdgeStub } from '@dungeonmaster/shared/contracts';

import { questHasNoOrphanFlowNodesGuard } from './quest-has-no-orphan-flow-nodes-guard';

describe('questHasNoOrphanFlowNodesGuard', () => {
  describe('all nodes connected', () => {
    it('VALID: {all nodes referenced by edges} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'start' }), FlowNodeStub({ id: 'end' })],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {node as both source and target} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: 'start' }),
            FlowNodeStub({ id: 'middle' }),
            FlowNodeStub({ id: 'end' }),
          ],
          edges: [
            FlowEdgeStub({ from: 'start', to: 'middle' }),
            FlowEdgeStub({ from: 'middle', to: 'end' }),
          ],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {node only as edge source} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'start' }), FlowNodeStub({ id: 'end' })],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questHasNoOrphanFlowNodesGuard({ flows: [] });

      expect(result).toBe(true);
    });

    it('VALID: {flow with no nodes and no edges} => returns true', () => {
      const flows = [FlowStub({ nodes: [], edges: [] })];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {multiple flows all connected} => returns true', () => {
      const flows = [
        FlowStub({
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          nodes: [FlowNodeStub({ id: 'a' }), FlowNodeStub({ id: 'b' })],
          edges: [FlowEdgeStub({ from: 'a', to: 'b' })],
        }),
        FlowStub({
          id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
          nodes: [FlowNodeStub({ id: 'x' }), FlowNodeStub({ id: 'y' })],
          edges: [FlowEdgeStub({ from: 'x', to: 'y' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(true);
    });
  });

  describe('orphan nodes', () => {
    it('INVALID_ORPHAN: {node with no edges at all} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: 'start' }),
            FlowNodeStub({ id: 'end' }),
            FlowNodeStub({ id: 'orphan' }),
          ],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID_ORPHAN: {single node with no edges} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'lonely' })],
          edges: [],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID_ORPHAN: {multiple orphan nodes} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: 'connected-a' }),
            FlowNodeStub({ id: 'connected-b' }),
            FlowNodeStub({ id: 'orphan-1' }),
            FlowNodeStub({ id: 'orphan-2' }),
          ],
          edges: [FlowEdgeStub({ from: 'connected-a', to: 'connected-b' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID_ORPHAN: {one flow valid, another has orphan} => returns false', () => {
      const flows = [
        FlowStub({
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          nodes: [FlowNodeStub({ id: 'a' }), FlowNodeStub({ id: 'b' })],
          edges: [FlowEdgeStub({ from: 'a', to: 'b' })],
        }),
        FlowStub({
          id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
          nodes: [
            FlowNodeStub({ id: 'x' }),
            FlowNodeStub({ id: 'y' }),
            FlowNodeStub({ id: 'orphan' }),
          ],
          edges: [FlowEdgeStub({ from: 'x', to: 'y' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID_ORPHAN: {terminal node not connected to any edge} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: 'start', type: 'state' }),
            FlowNodeStub({ id: 'end', type: 'terminal' }),
            FlowNodeStub({ id: 'error-exit', type: 'terminal' }),
          ],
          edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
        }),
      ];

      const result = questHasNoOrphanFlowNodesGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questHasNoOrphanFlowNodesGuard({});

      expect(result).toBe(false);
    });
  });
});
