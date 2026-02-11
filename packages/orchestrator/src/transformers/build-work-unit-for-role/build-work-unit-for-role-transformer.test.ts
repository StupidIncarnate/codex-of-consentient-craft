import {
  ContextStub,
  DependencyStepStub,
  ObservableStub,
  QuestContractEntryStub,
  QuestStub,
  RequirementStub,
} from '@dungeonmaster/shared/contracts';

import { buildWorkUnitForRoleTransformer } from './build-work-unit-for-role-transformer';
import { buildWorkUnitForRoleTransformerProxy } from './build-work-unit-for-role-transformer.proxy';

describe('buildWorkUnitForRoleTransformer', () => {
  describe('codeweaver role', () => {
    it('VALID: {role: codeweaver, step with contracts/observables, quest} => returns CodeweaverWorkUnit with filtered context', () => {
      buildWorkUnitForRoleTransformerProxy();

      const observable = ObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        requirementId: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
      });
      const requirement = RequirementStub({
        id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
      });
      const contractEntry = QuestContractEntryStub({ name: 'LoginCredentials' });
      const unrelatedContractEntry = QuestContractEntryStub({ name: 'UnrelatedContract' });

      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
        inputContracts: ['LoginCredentials'],
        outputContracts: [],
      });

      const quest = QuestStub({
        observables: [observable],
        requirements: [requirement],
        contracts: [contractEntry, unrelatedContractEntry],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'codeweaver',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        step,
        questId: quest.id,
        relatedContracts: [contractEntry],
        relatedObservables: [observable],
        relatedRequirements: [requirement],
      });
    });

    it('VALID: {role: codeweaver, step with empty inputContracts/outputContracts and empty observablesSatisfied} => returns empty related arrays', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        observablesSatisfied: [],
        inputContracts: [],
        outputContracts: [],
      });

      const quest = QuestStub({
        observables: [ObservableStub()],
        requirements: [RequirementStub()],
        contracts: [QuestContractEntryStub()],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'codeweaver',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        step,
        questId: quest.id,
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });
    });
  });

  describe('siegemaster role', () => {
    it('VALID: {role: siegemaster, step with observablesSatisfied, quest with matching observables/contexts} => returns SiegemasterWorkUnit', () => {
      buildWorkUnitForRoleTransformerProxy();

      const context = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const observable = ObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const unrelatedObservable = ObservableStub({
        id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });

      const quest = QuestStub({
        observables: [observable, unrelatedObservable],
        contexts: [context],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: quest.id,
        observables: [observable],
        contexts: [context],
      });
    });

    it('EDGE: {role: siegemaster, observable contextId has no matching context} => returns observable but empty contexts', () => {
      buildWorkUnitForRoleTransformerProxy();

      const observable = ObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        contextId: 'deadbeef-0000-4000-a000-000000000000',
      });

      const context = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });

      const quest = QuestStub({
        observables: [observable],
        contexts: [context],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: quest.id,
        observables: [observable],
        contexts: [],
      });
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {role: lawbringer, step with filesToCreate/filesToModify} => returns LawbringerWorkUnit with deduplicated filePaths', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        filesToCreate: ['/src/brokers/user/user-broker.ts'],
        filesToModify: ['/src/brokers/index.ts'],
      });

      const quest = QuestStub();

      const result = buildWorkUnitForRoleTransformer({
        role: 'lawbringer',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        filePaths: ['/src/brokers/user/user-broker.ts', '/src/brokers/index.ts'],
      });
    });
  });

  describe('spiritmender role', () => {
    it('VALID: {role: spiritmender, step with filesToCreate/filesToModify} => returns SpiritmenderWorkUnit with deduplicated filePaths', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        filesToCreate: ['/src/guards/auth/auth-guard.ts'],
        filesToModify: ['/src/guards/index.ts'],
      });

      const quest = QuestStub();

      const result = buildWorkUnitForRoleTransformer({
        role: 'spiritmender',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/guards/auth/auth-guard.ts', '/src/guards/index.ts'],
      });
    });
  });

  describe('pathseeker role', () => {
    it('ERROR: {role: pathseeker} => throws error because pathseeker is not step-based', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub();
      const quest = QuestStub();

      expect(() =>
        buildWorkUnitForRoleTransformer({
          role: 'pathseeker',
          step,
          quest,
        }),
      ).toThrow(/Role "pathseeker" is not step-based/u);
    });
  });
});
