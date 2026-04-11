import { FlowStub, FlowEdgeStub, FlowNodeStub } from '@dungeonmaster/shared/contracts';

import { questFlowEdgeIdsUniqueGuard } from './quest-flow-edge-ids-unique-guard';

describe('questFlowEdgeIdsUniqueGuard', () => {
  describe('unique edge ids', () => {
    it('VALID: {flow with distinct edge ids} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'a' }), FlowNodeStub({ id: 'b' }), FlowNodeStub({ id: 'c' })],
          edges: [
            FlowEdgeStub({ id: 'a-to-b', from: 'a', to: 'b' }),
            FlowEdgeStub({ id: 'b-to-c', from: 'b', to: 'c' }),
          ],
        }),
      ];

      const result = questFlowEdgeIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {same edge id used in different flows} => returns true', () => {
      const flows = [
        FlowStub({
          id: 'flow-a',
          nodes: [FlowNodeStub({ id: 'start' }), FlowNodeStub({ id: 'end' })],
          edges: [FlowEdgeStub({ id: 'start-end', from: 'start', to: 'end' })],
        }),
        FlowStub({
          id: 'flow-b',
          nodes: [FlowNodeStub({ id: 'start' }), FlowNodeStub({ id: 'end' })],
          edges: [FlowEdgeStub({ id: 'start-end', from: 'start', to: 'end' })],
        }),
      ];

      const result = questFlowEdgeIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questFlowEdgeIdsUniqueGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('duplicate edge ids', () => {
    it('INVALID: {two edges with same id in one flow} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [FlowNodeStub({ id: 'a' }), FlowNodeStub({ id: 'b' }), FlowNodeStub({ id: 'c' })],
          edges: [
            FlowEdgeStub({ id: 'dup-id', from: 'a', to: 'b' }),
            FlowEdgeStub({ id: 'dup-id', from: 'b', to: 'c' }),
          ],
        }),
      ];

      const result = questFlowEdgeIdsUniqueGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowEdgeIdsUniqueGuard({});

      expect(result).toBe(false);
    });
  });
});
