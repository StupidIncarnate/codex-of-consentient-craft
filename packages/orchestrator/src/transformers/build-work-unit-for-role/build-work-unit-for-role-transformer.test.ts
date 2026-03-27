import {
  DependencyStepStub,
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  QuestContractEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { buildWorkUnitForRoleTransformer } from './build-work-unit-for-role-transformer';
import { buildWorkUnitForRoleTransformerProxy } from './build-work-unit-for-role-transformer.proxy';

describe('buildWorkUnitForRoleTransformer', () => {
  describe('codeweaver role', () => {
    it('VALID: {role: codeweaver, step with contracts/observables, quest} => returns CodeweaverWorkUnit with filtered context', () => {
      buildWorkUnitForRoleTransformerProxy();

      const observable = FlowObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      });
      const contractEntry = QuestContractEntryStub({ name: 'LoginCredentials' });
      const unrelatedContractEntry = QuestContractEntryStub({ name: 'UnrelatedContract' });

      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
        inputContracts: ['LoginCredentials'],
        outputContracts: ['Void'],
      });

      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [observable],
              }),
            ],
          }),
        ],
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
      });
    });

    it('VALID: {role: codeweaver, step with empty inputContracts/outputContracts and empty observablesSatisfied} => returns empty related arrays', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        observablesSatisfied: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
      });

      const quest = QuestStub({
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
      });
    });
  });

  describe('siegemaster role', () => {
    it('VALID: {role: siegemaster, step with observablesSatisfied, quest with matching flow observables} => returns SiegemasterWorkUnit', () => {
      buildWorkUnitForRoleTransformerProxy();

      const observable = FlowObservableStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      });
      const unrelatedObservable = FlowObservableStub({
        id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      });

      const step = DependencyStepStub({
        observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      });

      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [observable, unrelatedObservable],
              }),
            ],
          }),
        ],
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
      });
    });

    it('EDGE: {role: siegemaster, no matching observables} => returns empty observables', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        observablesSatisfied: ['deadbeef-0000-4000-a000-000000000000'],
      });

      const quest = QuestStub({
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

      const result = buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        step,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: quest.id,
        observables: [],
      });
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {role: lawbringer, step with focusFile and accompanyingFiles} => returns LawbringerWorkUnit with deduplicated filePaths', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        focusFile: { path: '/src/brokers/user/user-broker.ts', action: 'create' },
        accompanyingFiles: [{ path: '/src/brokers/index.ts', action: 'create' }],
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
    it('VALID: {role: spiritmender, step with focusFile and accompanyingFiles} => returns SpiritmenderWorkUnit with deduplicated filePaths', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        focusFile: { path: '/src/guards/auth/auth-guard.ts', action: 'create' },
        accompanyingFiles: [{ path: '/src/guards/index.ts', action: 'create' }],
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
