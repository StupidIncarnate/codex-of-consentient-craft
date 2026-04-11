import {
  FlowStub,
  FlowNodeStub,
  FlowNodeIdStub,
  QuestContractEntryStub,
} from '@dungeonmaster/shared/contracts';

import { questContractNodeIdResolvesGuard } from './quest-contract-node-id-resolves-guard';

describe('questContractNodeIdResolvesGuard', () => {
  describe('valid references', () => {
    it('VALID: {contract nodeId matches an existing node} => returns true', () => {
      const nodeId = FlowNodeIdStub({ value: 'login-page' });
      const flows = [FlowStub({ nodes: [FlowNodeStub({ id: nodeId })] })];
      const contracts = [QuestContractEntryStub({ nodeId })];

      const result = questContractNodeIdResolvesGuard({ contracts, flows });

      expect(result).toBe(true);
    });

    it('VALID: {contract nodeId matches a node in a different flow} => returns true', () => {
      const nodeId = FlowNodeIdStub({ value: 'dashboard' });
      const flows = [
        FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }) })],
        }),
        FlowStub({
          id: 'dashboard-flow',
          nodes: [FlowNodeStub({ id: nodeId })],
        }),
      ];
      const contracts = [QuestContractEntryStub({ nodeId })];

      const result = questContractNodeIdResolvesGuard({ contracts, flows });

      expect(result).toBe(true);
    });

    it('VALID: {no contracts} => returns true', () => {
      const flows = [FlowStub({ nodes: [FlowNodeStub()] })];

      const result = questContractNodeIdResolvesGuard({ contracts: [], flows });

      expect(result).toBe(true);
    });
  });

  describe('orphaned contracts', () => {
    it('INVALID: {contract nodeId not found in any flow} => returns false', () => {
      const flows = [
        FlowStub({ nodes: [FlowNodeStub({ id: FlowNodeIdStub({ value: 'login-page' }) })] }),
      ];
      const contracts = [
        QuestContractEntryStub({ nodeId: FlowNodeIdStub({ value: 'missing-node' }) }),
      ];

      const result = questContractNodeIdResolvesGuard({ contracts, flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {contracts: undefined} => returns false', () => {
      const flows = [FlowStub()];

      const result = questContractNodeIdResolvesGuard({ flows });

      expect(result).toBe(false);
    });

    it('EMPTY: {flows: undefined} => returns false', () => {
      const contracts = [QuestContractEntryStub()];

      const result = questContractNodeIdResolvesGuard({ contracts });

      expect(result).toBe(false);
    });
  });
});
