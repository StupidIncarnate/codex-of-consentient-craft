import {
  ContractNameStub,
  DependencyStepStub,
  QuestContractEntryStub,
  StepFileReferenceStub,
} from '@dungeonmaster/shared/contracts';

import { questStepHasContractRefsGuard } from './quest-step-has-contract-refs-guard';

describe('questStepHasContractRefsGuard', () => {
  describe('backward compatibility', () => {
    it('VALID: {empty contracts array} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
          }),
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
    it('VALID: {step creating broker file with real outputContracts} => returns true', () => {
      const contractName = ContractNameStub({ value: 'UserProfile' });
      const contracts = [QuestContractEntryStub({ name: contractName })];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts',
          }),
          outputContracts: [contractName],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {step creating contract file with Void outputContracts} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/contracts/user-profile/user-profile-contract.ts',
          }),
          outputContracts: [ContractNameStub({ value: 'Void' })],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {step creating statics file with Void outputContracts} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/statics/config/config-statics.ts',
          }),
          outputContracts: [ContractNameStub({ value: 'Void' })],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {inputContracts is Void} => valid, returns true', () => {
      const contractName = ContractNameStub({ value: 'UserProfile' });
      const contracts = [QuestContractEntryStub({ name: contractName })];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts',
          }),
          inputContracts: [ContractNameStub({ value: 'Void' })],
          outputContracts: [contractName],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });
  });

  describe('missing contract refs', () => {
    it('INVALID: {step creating broker file but outputContracts is Void} => returns false', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts',
          }),
          outputContracts: [ContractNameStub({ value: 'Void' })],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });

    it('INVALID: {step creating guard file but outputContracts is Void} => returns false', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
          outputContracts: [ContractNameStub({ value: 'Void' })],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {mix of contract-exempt and non-exempt steps, all valid} => returns true', () => {
      const contractName = ContractNameStub({ value: 'UserProfile' });
      const contracts = [QuestContractEntryStub({ name: contractName })];
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/contracts/user-profile/user-profile-contract.ts',
          }),
          outputContracts: [ContractNameStub({ value: 'Void' })],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts',
          }),
          outputContracts: [contractName],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('EDGE: {focusFile path has no recognizable folder type} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
          }),
          outputContracts: [ContractNameStub({ value: 'Void' })],
        }),
      ];

      const result = questStepHasContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
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
