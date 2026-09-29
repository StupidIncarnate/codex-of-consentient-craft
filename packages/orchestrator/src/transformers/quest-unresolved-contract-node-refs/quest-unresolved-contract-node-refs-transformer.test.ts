import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts/quest-contract-entry/quest-contract-entry.stub';

import { questUnresolvedContractNodeRefsTransformer } from './quest-unresolved-contract-node-refs-transformer';

describe('questUnresolvedContractNodeRefsTransformer', () => {
  describe('all resolved', () => {
    it('VALID: {nodeIds resolve} => returns []', () => {
      const node = FlowNodeStub({ id: 'anchor-node' });
      const flow = FlowStub({ nodes: [node] });
      const contract = QuestContractEntryStub({
        nodeId: 'anchor-node',
      });

      const result = questUnresolvedContractNodeRefsTransformer({
        contracts: [contract],
        flows: [flow],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unresolved', () => {
    it('INVALID: {nodeId does not exist} => returns description', () => {
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials',
        nodeId: 'ghost-node',
      });

      const result = questUnresolvedContractNodeRefsTransformer({
        contracts: [contract],
        flows: [],
      });

      expect(result).toStrictEqual([
        "contract 'LoginCredentials' has unresolved nodeId 'ghost-node'",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {contracts: undefined} => returns []', () => {
      const result = questUnresolvedContractNodeRefsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
