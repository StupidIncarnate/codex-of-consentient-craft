import { FlowNodeStub, FlowStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { questUnresolvedContractNodeRefsTransformer } from './quest-unresolved-contract-node-refs-transformer';

describe('questUnresolvedContractNodeRefsTransformer', () => {
  describe('all resolved', () => {
    it('VALID: {nodeIds resolve} => returns []', () => {
      const node = FlowNodeStub({ id: 'anchor-node' as never });
      const flow = FlowStub({ nodes: [node] });
      const contract = QuestContractEntryStub({
        nodeId: 'anchor-node' as never,
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
        name: 'LoginCredentials' as never,
        nodeId: 'ghost-node' as never,
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
