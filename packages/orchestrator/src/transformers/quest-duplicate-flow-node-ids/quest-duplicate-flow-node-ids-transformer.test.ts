import { FlowNodeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDuplicateFlowNodeIdsTransformer } from './quest-duplicate-flow-node-ids-transformer';

describe('questDuplicateFlowNodeIdsTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique node ids} => returns []', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'n1' as never, label: 'A' as never }),
          FlowNodeStub({ id: 'n2' as never, label: 'B' as never }),
        ],
      });

      const result = questDuplicateFlowNodeIdsTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates in one flow', () => {
    it('INVALID: {flow has two nodes with same id} => returns description with flow id and node ids', () => {
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [
          FlowNodeStub({ id: 'same-node' as never, label: 'First' as never }),
          FlowNodeStub({ id: 'same-node' as never, label: 'Second' as never }),
        ],
      });

      const result = questDuplicateFlowNodeIdsTransformer({ flows: [flow] });

      expect(result).toStrictEqual(["flow 'login-flow': duplicate nodes 'same-node'"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDuplicateFlowNodeIdsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
