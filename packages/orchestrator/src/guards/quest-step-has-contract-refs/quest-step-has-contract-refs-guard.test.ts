import {
  ContractNameStub,
  DependencyStepStub,
  QuestContractEntryStub,
} from '@dungeonmaster/shared/contracts';

import { questStepHasContractRefsGuard } from './quest-step-has-contract-refs-guard';

describe('questStepHasContractRefsGuard', () => {
  describe('backward compatibility', () => {
    it('VALID: {empty contracts array} => returns true', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts'],
          filesToModify: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts: [] });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps array} => returns true', () => {
      const contracts = [QuestContractEntryStub()];

      const result = questStepHasContractRefsGuard({ steps: [], contracts });

      expect(result).toBe(true);
    });
  });

  describe('valid contract refs', () => {
    it('VALID: {step creating broker file with outputContracts set} => returns true', () => {
      const contractName = ContractNameStub({ value: 'UserProfile' });
      const contracts = [QuestContractEntryStub({ name: contractName })];
      const steps = [
        DependencyStepStub({
          filesToCreate: ['packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts'],
          filesToModify: [],
          outputContracts: [contractName],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {step creating contract file with no outputContracts} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          filesToCreate: ['packages/shared/src/contracts/user-profile/user-profile-contract.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {step creating statics file with no outputContracts} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          filesToCreate: ['packages/shared/src/statics/config/config-statics.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {step with no filesToCreate and no filesToModify} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          filesToCreate: [],
          filesToModify: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });
  });

  describe('missing contract refs', () => {
    it('INVALID_CONTRACTS: {step creating broker file but outputContracts empty} => returns false', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          filesToCreate: ['packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });

    it('INVALID_CONTRACTS: {step creating guard file but outputContracts empty} => returns false', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          filesToCreate: ['packages/orchestrator/src/guards/is-valid/is-valid-guard.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {step modifying broker file with empty outputContracts} => returns false', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          filesToCreate: [],
          filesToModify: ['packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts'],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });

    it('EDGE: {mix of contract-exempt and non-exempt steps, all valid} => returns true', () => {
      const contractName = ContractNameStub({ value: 'UserProfile' });
      const contracts = [QuestContractEntryStub({ name: contractName })];
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          filesToCreate: ['packages/shared/src/contracts/user-profile/user-profile-contract.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          filesToCreate: ['packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts'],
          filesToModify: [],
          outputContracts: [contractName],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('EDGE: {mix of steps, non-exempt step missing outputContracts} => returns false', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          filesToCreate: ['packages/shared/src/contracts/user-profile/user-profile-contract.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          filesToCreate: ['packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts'],
          filesToModify: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasContractRefsGuard({ contracts: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {contracts: undefined} => returns false', () => {
      const result = questStepHasContractRefsGuard({ steps: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questStepHasContractRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
