import { FlowNodeIdStub } from '../../contracts/flow-node-id/flow-node-id.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';

import { collectNodeContractsTransformer } from './collect-node-contracts-transformer';

describe('collectNodeContractsTransformer', () => {
  describe('matching contracts', () => {
    it('VALID: {nodeId: "submit-form", contracts with matching nodeId} => returns matched contracts', () => {
      const nodeId = FlowNodeIdStub({ value: 'submit-form' });
      const matchingContract = QuestContractEntryStub({
        id: 'login-credentials',
        name: 'LoginCredentials',
        nodeId,
      });
      const otherContract = QuestContractEntryStub({
        id: 'auth-token',
        name: 'AuthToken',
        nodeId: FlowNodeIdStub({ value: 'receive-response' }),
      });

      const result = collectNodeContractsTransformer({
        nodeId,
        contracts: [matchingContract, otherContract],
      });

      expect(result).toStrictEqual([
        {
          id: 'login-credentials',
          name: 'LoginCredentials',
          kind: 'data',
          status: 'new',
          source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
          nodeId: 'submit-form',
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

    it('VALID: {nodeId: "api-call", multiple contracts with same nodeId} => returns all matched', () => {
      const nodeId = FlowNodeIdStub({ value: 'api-call' });
      const contractA = QuestContractEntryStub({
        id: 'request-body',
        name: 'RequestBody',
        nodeId,
      });
      const contractB = QuestContractEntryStub({
        id: 'response-body',
        name: 'ResponseBody',
        nodeId,
      });

      const result = collectNodeContractsTransformer({
        nodeId,
        contracts: [contractA, contractB],
      });

      expect(result).toStrictEqual([
        {
          id: 'request-body',
          name: 'RequestBody',
          kind: 'data',
          status: 'new',
          source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
          nodeId: 'api-call',
          properties: [
            {
              name: 'email',
              type: 'EmailAddress',
              description: 'User email for authentication',
            },
          ],
        },
        {
          id: 'response-body',
          name: 'ResponseBody',
          kind: 'data',
          status: 'new',
          source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
          nodeId: 'api-call',
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

  describe('no matching contracts', () => {
    it('VALID: {nodeId: "submit-form", no contracts with that nodeId} => returns empty array', () => {
      const nodeId = FlowNodeIdStub({ value: 'submit-form' });
      const unlinkedContract = QuestContractEntryStub({
        id: 'login-credentials',
        name: 'LoginCredentials',
      });
      const otherNodeContract = QuestContractEntryStub({
        id: 'auth-token',
        name: 'AuthToken',
        nodeId: FlowNodeIdStub({ value: 'receive-response' }),
      });

      const result = collectNodeContractsTransformer({
        nodeId,
        contracts: [unlinkedContract, otherNodeContract],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {contracts: []} => returns empty array', () => {
      const nodeId = FlowNodeIdStub({ value: 'submit-form' });

      const result = collectNodeContractsTransformer({
        nodeId,
        contracts: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {all contracts unlinked} => returns empty array', () => {
      const nodeId = FlowNodeIdStub({ value: 'submit-form' });
      const unlinkedA = QuestContractEntryStub({
        id: 'contract-a',
        name: 'ContractA',
      });
      const unlinkedB = QuestContractEntryStub({
        id: 'contract-b',
        name: 'ContractB',
      });

      const result = collectNodeContractsTransformer({
        nodeId,
        contracts: [unlinkedA, unlinkedB],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
