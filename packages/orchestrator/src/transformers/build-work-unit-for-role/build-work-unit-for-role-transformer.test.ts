import {
  DependencyStepStub,
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  QuestContractEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { DevServerUrlStub } from '../../contracts/dev-server-url/dev-server-url.stub';
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
    it('VALID: {role: siegemaster, flow, quest, devServerUrl} => returns SiegemasterWorkUnit with flow and all design decisions', () => {
      buildWorkUnitForRoleTransformerProxy();

      const flow = FlowStub({
        id: 'checkout-flow',
        name: 'Checkout Flow',
        nodes: [
          FlowNodeStub({
            id: 'cart-page',
            observables: [FlowObservableStub()],
          }),
        ],
      });

      const quest = QuestStub({
        flows: [flow],
      });

      const devServerUrl = DevServerUrlStub({ value: 'http://localhost:4700' });

      const result = buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        flow,
        quest,
        devServerUrl,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
        devServerUrl,
      });
    });

    it('VALID: {role: siegemaster, flow, quest, no devServerUrl} => returns SiegemasterWorkUnit without devServerUrl', () => {
      buildWorkUnitForRoleTransformerProxy();

      const flow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            observables: [FlowObservableStub()],
          }),
        ],
      });

      const quest = QuestStub({
        flows: [flow],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        flow,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
      });
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {role: lawbringer, step with focusFile and accompanyingFiles} => returns LawbringerWorkUnit with deduplicated filePaths', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        focusFile: { path: '/src/brokers/user/user-broker.ts' },
        accompanyingFiles: [{ path: '/src/brokers/index.ts' }],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'lawbringer',
        step,
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

      const result = buildWorkUnitForRoleTransformer({
        role: 'spiritmender',
        step,
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/guards/auth/auth-guard.ts', '/src/guards/index.ts'],
      });
    });
  });
});
