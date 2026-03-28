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
        relatedDesignDecisions: [],
        relatedFlows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [observable],
              }),
            ],
          }),
        ],
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
        relatedDesignDecisions: [],
        relatedFlows: [],
      });
    });
  });

  describe('siegemaster role', () => {
    it('ERROR: {role: siegemaster} => throws error because siegemaster is not step-based', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub();
      const quest = QuestStub();

      expect(() =>
        buildWorkUnitForRoleTransformer({
          role: 'siegemaster',
          step,
          quest,
        }),
      ).toThrow(/Role "siegemaster" is not step-based/u);
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {role: lawbringer, step with focusFile and accompanyingFiles} => returns LawbringerWorkUnit with deduplicated filePaths', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        focusFile: { path: '/src/brokers/user/user-broker.ts' },
        accompanyingFiles: [{ path: '/src/brokers/index.ts' }],
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
        focusFile: { path: '/src/guards/auth/auth-guard.ts' },
        accompanyingFiles: [{ path: '/src/guards/index.ts' }],
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
