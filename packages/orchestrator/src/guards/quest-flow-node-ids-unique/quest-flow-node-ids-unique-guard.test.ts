import { FlowStub, FlowNodeStub, FlowNodeIdStub } from '@dungeonmaster/shared/contracts';

import { questFlowNodeIdsUniqueGuard } from './quest-flow-node-ids-unique-guard';

describe('questFlowNodeIdsUniqueGuard', () => {
  describe('unique node ids', () => {
    it('VALID: {flow with distinct node ids} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }) }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'dashboard' }) }),
          ],
        }),
      ];

      const result = questFlowNodeIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {same node id used in different flows} => returns true', () => {
      const flows = [
        FlowStub({
          id: 'flow-a',
          nodes: [FlowNodeStub({ id: FlowNodeIdStub({ value: 'start' }) })],
        }),
        FlowStub({
          id: 'flow-b',
          nodes: [FlowNodeStub({ id: FlowNodeIdStub({ value: 'start' }) })],
        }),
      ];

      const result = questFlowNodeIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questFlowNodeIdsUniqueGuard({ flows: [] });

      expect(result).toBe(true);
    });

    it('VALID: {flow with no nodes} => returns true', () => {
      const flows = [FlowStub({ nodes: [] })];

      const result = questFlowNodeIdsUniqueGuard({ flows });

      expect(result).toBe(true);
    });
  });

  describe('duplicate node ids', () => {
    it('INVALID: {two nodes with same id in one flow} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }) }),
            FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }) }),
          ],
        }),
      ];

      const result = questFlowNodeIdsUniqueGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowNodeIdsUniqueGuard({});

      expect(result).toBe(false);
    });
  });
});
