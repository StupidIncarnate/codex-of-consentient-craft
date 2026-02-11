import {
  DependencyStepStub,
  ObservableStub,
  QuestContractEntryStub,
  QuestStub,
  RequirementStub,
} from '@dungeonmaster/shared/contracts';

import { stepToQuestContextTransformer } from './step-to-quest-context-transformer';

describe('stepToQuestContextTransformer', () => {
  describe('contract matching', () => {
    it('VALID: {step with inputContracts matching quest contracts} => returns matched contracts', () => {
      const contract = QuestContractEntryStub({ name: 'LoginCredentials' });
      const step = DependencyStepStub({
        inputContracts: ['LoginCredentials'],
        outputContracts: [],
      });
      const quest = QuestStub({
        contracts: [
          contract,
          QuestContractEntryStub({
            id: 'b47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'UserProfile',
          }),
        ],
        observables: [],
        requirements: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [contract],
        relatedObservables: [],
        relatedRequirements: [],
      });
    });

    it('VALID: {step with outputContracts matching quest contracts} => returns matched contracts', () => {
      const contract = QuestContractEntryStub({ name: 'AuthToken' });
      const step = DependencyStepStub({
        inputContracts: [],
        outputContracts: ['AuthToken'],
      });
      const quest = QuestStub({
        contracts: [contract],
        observables: [],
        requirements: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [contract],
        relatedObservables: [],
        relatedRequirements: [],
      });
    });

    it('VALID: {step with both input and output contracts} => returns all matched contracts', () => {
      const inputContract = QuestContractEntryStub({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'LoginCredentials',
      });
      const outputContract = QuestContractEntryStub({
        id: 'b47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'AuthToken',
      });
      const step = DependencyStepStub({
        inputContracts: ['LoginCredentials'],
        outputContracts: ['AuthToken'],
      });
      const quest = QuestStub({
        contracts: [inputContract, outputContract],
        observables: [],
        requirements: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [inputContract, outputContract],
        relatedObservables: [],
        relatedRequirements: [],
      });
    });
  });

  describe('observable matching', () => {
    it('VALID: {step with observablesSatisfied matching quest observables} => returns matched observables', () => {
      const observable = ObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });
      const quest = QuestStub({
        contracts: [],
        observables: [observable, ObservableStub({ id: 'b1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })],
        requirements: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [observable],
        relatedRequirements: [],
      });
    });
  });

  describe('requirement matching via observables', () => {
    it('VALID: {observable with requirementId} => returns matched requirements', () => {
      const requirement = RequirementStub({ id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479' });
      const observable = ObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        requirementId: 'b12ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });
      const quest = QuestStub({
        contracts: [],
        observables: [observable],
        requirements: [
          requirement,
          RequirementStub({ id: 'c12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Other' }),
        ],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [observable],
        relatedRequirements: [requirement],
      });
    });

    it('VALID: {observable without requirementId} => returns no requirements', () => {
      const observable = ObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      });
      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });
      const quest = QuestStub({
        contracts: [],
        observables: [observable],
        requirements: [RequirementStub()],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [observable],
        relatedRequirements: [],
      });
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {step with no contracts or observables} => returns all empty arrays', () => {
      const step = DependencyStepStub({
        inputContracts: [],
        outputContracts: [],
        observablesSatisfied: [],
      });
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        observables: [ObservableStub()],
        requirements: [RequirementStub()],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });
    });

    it('EMPTY: {quest with empty arrays} => returns all empty arrays', () => {
      const step = DependencyStepStub({
        inputContracts: ['LoginCredentials'],
        outputContracts: ['AuthToken'],
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });
      const quest = QuestStub({
        contracts: [],
        observables: [],
        requirements: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });
    });
  });
});
