import { FlowNodeIdStub } from '../../contracts/flow-node-id/flow-node-id.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';

import { collectUnlinkedContractsTransformer } from './collect-unlinked-contracts-transformer';

describe('collectUnlinkedContractsTransformer', () => {
  describe('unlinked contracts', () => {
    it('VALID: {contracts with no nodeId} => returns all unlinked contracts', () => {
      const unlinkedA = QuestContractEntryStub({
        id: 'login-credentials',
        name: 'LoginCredentials',
      });
      const unlinkedB = QuestContractEntryStub({
        id: 'auth-token',
        name: 'AuthToken',
      });

      const result = collectUnlinkedContractsTransformer({
        contracts: [unlinkedA, unlinkedB],
      });

      expect(result).toStrictEqual([
        {
          id: 'login-credentials',
          name: 'LoginCredentials',
          kind: 'data',
          status: 'new',
          properties: [
            {
              name: 'email',
              type: 'EmailAddress',
              description: 'User email for authentication',
            },
          ],
        },
        {
          id: 'auth-token',
          name: 'AuthToken',
          kind: 'data',
          status: 'new',
          properties: [
            {
              name: 'email',
              type: 'EmailAddress',
              description: 'User email for authentication',
            },
          ],
        },
      ]);
    });

    it('VALID: {mix of linked and unlinked} => returns only unlinked', () => {
      const unlinked = QuestContractEntryStub({
        id: 'login-credentials',
        name: 'LoginCredentials',
      });
      const linked = QuestContractEntryStub({
        id: 'auth-token',
        name: 'AuthToken',
        nodeId: FlowNodeIdStub({ value: 'submit-form' }),
      });

      const result = collectUnlinkedContractsTransformer({
        contracts: [unlinked, linked],
      });

      expect(result).toStrictEqual([
        {
          id: 'login-credentials',
          name: 'LoginCredentials',
          kind: 'data',
          status: 'new',
          properties: [
            {
              name: 'email',
              type: 'EmailAddress',
              description: 'User email for authentication',
            },
          ],
        },
      ]);
    });
  });

  describe('no unlinked contracts', () => {
    it('VALID: {all contracts have nodeId} => returns empty array', () => {
      const linkedA = QuestContractEntryStub({
        id: 'login-credentials',
        name: 'LoginCredentials',
        nodeId: FlowNodeIdStub({ value: 'submit-form' }),
      });
      const linkedB = QuestContractEntryStub({
        id: 'auth-token',
        name: 'AuthToken',
        nodeId: FlowNodeIdStub({ value: 'receive-response' }),
      });

      const result = collectUnlinkedContractsTransformer({
        contracts: [linkedA, linkedB],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {contracts: []} => returns empty array', () => {
      const result = collectUnlinkedContractsTransformer({
        contracts: [],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
