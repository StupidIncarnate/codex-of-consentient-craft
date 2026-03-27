import {
  DependencyStepStub,
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  QuestContractEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { stepToQuestContextTransformer } from './step-to-quest-context-transformer';

describe('stepToQuestContextTransformer', () => {
  describe('contract matching', () => {
    it('VALID: {step with inputContracts matching quest contracts} => returns matched contracts', () => {
      const contract = QuestContractEntryStub({ name: 'LoginCredentials' });
      const step = DependencyStepStub({
        inputContracts: ['LoginCredentials'],
        outputContracts: ['Void'],
      });
      const quest = QuestStub({
        contracts: [
          contract,
          QuestContractEntryStub({
            id: 'b47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'UserProfile',
          }),
        ],
        flows: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [contract],
        relatedObservables: [],
      });
    });

    it('VALID: {step with outputContracts matching quest contracts} => returns matched contracts', () => {
      const contract = QuestContractEntryStub({ name: 'AuthToken' });
      const step = DependencyStepStub({
        inputContracts: ['Void'],
        outputContracts: ['AuthToken'],
      });
      const quest = QuestStub({
        contracts: [contract],
        flows: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [contract],
        relatedObservables: [],
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
        flows: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [inputContract, outputContract],
        relatedObservables: [],
      });
    });
  });

  describe('observable matching', () => {
    it('VALID: {step with observablesSatisfied matching flow node observables} => returns matched observables', () => {
      const observable = FlowObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const otherObservable = FlowObservableStub({ id: 'b1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });
      const quest = QuestStub({
        contracts: [],
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [observable, otherObservable],
              }),
            ],
          }),
        ],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [observable],
      });
    });

    it('VALID: {observables spread across multiple flows and nodes} => returns matched from all', () => {
      const obs1 = FlowObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obs2 = FlowObservableStub({ id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
      const step = DependencyStepStub({
        observablesSatisfied: [
          'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        ],
      });
      const quest = QuestStub({
        contracts: [],
        flows: [
          FlowStub({
            id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
            nodes: [FlowNodeStub({ id: 'login-page', observables: [obs1] })],
          }),
          FlowStub({
            id: 'd23bd10b-58cc-4372-a567-0e02b2c3d479',
            nodes: [FlowNodeStub({ id: 'dashboard', observables: [obs2] })],
          }),
        ],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [obs1, obs2],
      });
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {step with no contracts or observables} => returns all empty arrays', () => {
      const step = DependencyStepStub({
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        observablesSatisfied: [],
      });
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [FlowObservableStub()],
              }),
            ],
          }),
        ],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [],
      });
    });

    it('EMPTY: {quest with empty flows} => returns all empty arrays', () => {
      const step = DependencyStepStub({
        inputContracts: ['LoginCredentials'],
        outputContracts: ['AuthToken'],
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });
      const quest = QuestStub({
        contracts: [],
        flows: [],
      });

      const result = stepToQuestContextTransformer({ step, quest });

      expect(result).toStrictEqual({
        relatedContracts: [],
        relatedObservables: [],
      });
    });
  });
});
