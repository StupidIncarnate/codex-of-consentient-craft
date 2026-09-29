import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDuplicateFlowNodeIdsTransformer } from './quest-duplicate-flow-node-ids-transformer';

describe('questDuplicateFlowNodeIdsTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique node ids} => returns []', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'n1', label: 'A' }), FlowNodeStub({ id: 'n2', label: 'B' })],
      });

      const result = questDuplicateFlowNodeIdsTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates in one flow', () => {
    it('INVALID: {flow has two nodes with same id} => returns description with flow id and node ids', () => {
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({ id: 'same-node', label: 'First' }),
          FlowNodeStub({ id: 'same-node', label: 'Second' }),
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
