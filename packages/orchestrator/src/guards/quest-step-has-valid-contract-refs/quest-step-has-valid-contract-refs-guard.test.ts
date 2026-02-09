import {
  ContractNameStub,
  DependencyStepStub,
  QuestContractEntryStub,
} from '@dungeonmaster/shared/contracts';

import { questStepHasValidContractRefsGuard } from './quest-step-has-valid-contract-refs-guard';

describe('questStepHasValidContractRefsGuard', () => {
  describe('backward compatibility', () => {
    it('VALID: {empty contracts array} => returns true', () => {
      const steps = [
        DependencyStepStub({
          inputContracts: [ContractNameStub({ value: 'NonExistent' })],
          outputContracts: [ContractNameStub({ value: 'AlsoNonExistent' })],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts: [] });

      expect(result).toBe(true);
    });
  });

  describe('valid references', () => {
    it('VALID: {step with inputContracts and outputContracts that all exist} => returns true', () => {
      const inputName = ContractNameStub({ value: 'LoginCredentials' });
      const outputName = ContractNameStub({ value: 'AuthToken' });
      const contracts = [
        QuestContractEntryStub({
          id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
          name: inputName,
        }),
        QuestContractEntryStub({
          id: 'b58cd21c-69dd-4483-b678-1f13c3d4e580',
          name: outputName,
        }),
      ];
      const steps = [
        DependencyStepStub({
          inputContracts: [inputName],
          outputContracts: [outputName],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {step with empty inputContracts and empty outputContracts} => returns true', () => {
      const contracts = [QuestContractEntryStub()];
      const steps = [
        DependencyStepStub({
          inputContracts: [],
          outputContracts: [],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });

    it('VALID: {multiple steps, all valid refs} => returns true', () => {
      const credentialsName = ContractNameStub({ value: 'LoginCredentials' });
      const tokenName = ContractNameStub({ value: 'AuthToken' });
      const contracts = [
        QuestContractEntryStub({
          id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
          name: credentialsName,
        }),
        QuestContractEntryStub({
          id: 'b58cd21c-69dd-4483-b678-1f13c3d4e580',
          name: tokenName,
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          inputContracts: [credentialsName],
          outputContracts: [tokenName],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          inputContracts: [tokenName],
          outputContracts: [credentialsName],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts });

      expect(result).toBe(true);
    });
  });

  describe('invalid references', () => {
    it('INVALID_CONTRACTS: {step with inputContracts referencing non-existent contract} => returns false', () => {
      const existingName = ContractNameStub({ value: 'LoginCredentials' });
      const nonExistentName = ContractNameStub({ value: 'NonExistentContract' });
      const contracts = [QuestContractEntryStub({ name: existingName })];
      const steps = [
        DependencyStepStub({
          inputContracts: [nonExistentName],
          outputContracts: [],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });

    it('INVALID_CONTRACTS: {step with outputContracts referencing non-existent contract} => returns false', () => {
      const existingName = ContractNameStub({ value: 'LoginCredentials' });
      const nonExistentName = ContractNameStub({ value: 'NonExistentContract' });
      const contracts = [QuestContractEntryStub({ name: existingName })];
      const steps = [
        DependencyStepStub({
          inputContracts: [],
          outputContracts: [nonExistentName],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {multiple steps, one has invalid ref} => returns false', () => {
      const credentialsName = ContractNameStub({ value: 'LoginCredentials' });
      const tokenName = ContractNameStub({ value: 'AuthToken' });
      const nonExistentName = ContractNameStub({ value: 'NonExistentContract' });
      const contracts = [
        QuestContractEntryStub({
          id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
          name: credentialsName,
        }),
        QuestContractEntryStub({
          id: 'b58cd21c-69dd-4483-b678-1f13c3d4e580',
          name: tokenName,
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          inputContracts: [credentialsName],
          outputContracts: [tokenName],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          inputContracts: [nonExistentName],
          outputContracts: [],
        }),
      ];

      const result = questStepHasValidContractRefsGuard({ steps, contracts });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasValidContractRefsGuard({ contracts: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {contracts: undefined} => returns false', () => {
      const result = questStepHasValidContractRefsGuard({ steps: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questStepHasValidContractRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
