import { DependencyStepStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { questOrphanNewContractsTransformer } from './quest-orphan-new-contracts-transformer';

describe('questOrphanNewContractsTransformer', () => {
  describe('all new contracts produced by a step', () => {
    it('VALID: {new contract appears in a step outputContracts} => returns []', () => {
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials' as never,
        status: 'new',
      });
      const step = DependencyStepStub({
        id: 'backend-create-login-credentials' as never,
        outputContracts: ['LoginCredentials' as never],
      });

      const result = questOrphanNewContractsTransformer({
        contracts: [contract],
        steps: [step],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('new contract not produced by any step', () => {
    it('INVALID: {new contract missing from all step outputContracts} => returns description with name and source', () => {
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials' as never,
        status: 'new',
        source:
          'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts' as never,
      });
      const step = DependencyStepStub({
        id: 'backend-other' as never,
        outputContracts: ['SomethingElse' as never],
      });

      const result = questOrphanNewContractsTransformer({
        contracts: [contract],
        steps: [step],
      });

      expect(result).toStrictEqual([
        "contract 'LoginCredentials' (source 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts') has status 'new' but is not produced by any step's outputContracts",
      ]);
    });
  });

  describe('existing or modified contracts', () => {
    it('VALID: {contract status: existing, not in any step output} => returns []', () => {
      const contract = QuestContractEntryStub({
        name: 'AlreadyHere' as never,
        status: 'existing',
      });
      const step = DependencyStepStub({
        id: 'backend-other' as never,
        outputContracts: ['Void' as never],
      });

      const result = questOrphanNewContractsTransformer({
        contracts: [contract],
        steps: [step],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {contract status: modified, not in any step output} => returns []', () => {
      const contract = QuestContractEntryStub({
        name: 'TweakedShape' as never,
        status: 'modified',
      });
      const step = DependencyStepStub({
        id: 'backend-other' as never,
        outputContracts: ['Void' as never],
      });

      const result = questOrphanNewContractsTransformer({
        contracts: [contract],
        steps: [step],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {contracts: undefined} => returns []', () => {
      const result = questOrphanNewContractsTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {new contract present, steps: undefined} => returns description', () => {
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials' as never,
        status: 'new',
        source:
          'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts' as never,
      });

      const result = questOrphanNewContractsTransformer({
        contracts: [contract],
      });

      expect(result).toStrictEqual([
        "contract 'LoginCredentials' (source 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts') has status 'new' but is not produced by any step's outputContracts",
      ]);
    });
  });
});
