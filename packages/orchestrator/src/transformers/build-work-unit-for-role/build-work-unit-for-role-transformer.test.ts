import {
  DependencyStepStub,
  ErrorMessageStub,
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  QuestContractEntryStub,
  QuestIdStub,
  QuestStub,
  StepFileReferenceStub,
} from '@dungeonmaster/shared/contracts';

import { DevCommandStub } from '../../contracts/dev-command/dev-command.stub';
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
        steps: [step],
        quest,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        steps: [step],
        folderTypes: ['brokers'],
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
        steps: [step],
        quest,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        steps: [step],
        folderTypes: ['brokers'],
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

    it('VALID: {role: siegemaster, flow, quest, devCommand, devServerUrl} => returns SiegemasterWorkUnit with both devCommand and devServerUrl', () => {
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
      const devCommand = DevCommandStub({ value: 'npm run dev' });

      const result = buildWorkUnitForRoleTransformer({
        role: 'siegemaster',
        flow,
        quest,
        devServerUrl,
        devCommand,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
        devServerUrl,
        devCommand,
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

  describe('flowrider role', () => {
    it('VALID: {role: flowrider, flow, quest, focusFiles, devServerUrl, devCommand} => returns FlowriderWorkUnit with all runtime fields', () => {
      buildWorkUnitForRoleTransformerProxy();

      const flow = FlowStub({
        id: 'checkout-flow',
        name: 'Checkout Flow',
        nodes: [FlowNodeStub({ id: 'cart-page', observables: [FlowObservableStub()] })],
      });
      const quest = QuestStub({ flows: [flow] });
      const focusFile = StepFileReferenceStub().path;
      const devServerUrl = DevServerUrlStub({ value: 'http://localhost:4700' });
      const devCommand = DevCommandStub({ value: 'npm run dev' });

      const result = buildWorkUnitForRoleTransformer({
        role: 'flowrider',
        flow,
        quest,
        focusFiles: [focusFile],
        devServerUrl,
        devCommand,
      });

      expect(result).toStrictEqual({
        role: 'flowrider',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
        focusFiles: [focusFile],
        devServerUrl,
        devCommand,
      });
    });

    it('VALID: {role: flowrider, flow, quest, no dev server} => returns FlowriderWorkUnit with empty focusFiles and no dev server', () => {
      buildWorkUnitForRoleTransformerProxy();

      const flow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        nodes: [FlowNodeStub({ id: 'login-page', observables: [FlowObservableStub()] })],
      });
      const quest = QuestStub({ flows: [flow] });

      const result = buildWorkUnitForRoleTransformer({
        role: 'flowrider',
        flow,
        quest,
      });

      expect(result).toStrictEqual({
        role: 'flowrider',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
        focusFiles: [],
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
        steps: [step],
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        reviewMode: 'per-steps',
        filePaths: ['/src/brokers/user/user-broker.ts', '/src/brokers/index.ts'],
        folderTypes: ['brokers'],
        stepBoundaries: [
          {
            stepId: step.id,
            filePaths: ['/src/brokers/user/user-broker.ts', '/src/brokers/index.ts'],
          },
        ],
      });
    });

    it('VALID: {role: lawbringer, with questId} => includes questId on the work unit', () => {
      buildWorkUnitForRoleTransformerProxy();

      const step = DependencyStepStub({
        focusFile: { path: '/src/brokers/user/user-broker.ts' },
        accompanyingFiles: [],
      });

      const result = buildWorkUnitForRoleTransformer({
        role: 'lawbringer',
        steps: [step],
        questId: QuestIdStub({ value: 'my-quest' }),
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        reviewMode: 'per-steps',
        filePaths: ['/src/brokers/user/user-broker.ts'],
        folderTypes: ['brokers'],
        stepBoundaries: [{ stepId: step.id, filePaths: ['/src/brokers/user/user-broker.ts'] }],
        questId: 'my-quest',
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

    it('VALID: {role: spiritmender, filePaths/errors/verificationCommand/contextInstructions batch} => returns SpiritmenderWorkUnit populated with all four fields', () => {
      buildWorkUnitForRoleTransformerProxy();

      const { path: filePathA } = StepFileReferenceStub({
        path: '/src/brokers/auth/auth-broker.ts',
      });
      const { path: filePathB } = StepFileReferenceStub({ path: '/src/brokers/auth/index.ts' });
      const errorA = ErrorMessageStub({ value: 'TS2339: property foo does not exist' });
      const errorB = ErrorMessageStub({ value: 'no-unused-vars: bar is defined but never used' });

      const result = buildWorkUnitForRoleTransformer({
        role: 'spiritmender',
        filePaths: [filePathA, filePathB],
        errors: [errorA, errorB],
        verificationCommand:
          'npm run ward -- -- /src/brokers/auth/auth-broker.ts /src/brokers/auth/index.ts' as never,
        contextInstructions: '## Instructions\nFix ward failures in the listed files.' as never,
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/brokers/auth/auth-broker.ts', '/src/brokers/auth/index.ts'],
        errors: [
          'TS2339: property foo does not exist',
          'no-unused-vars: bar is defined but never used',
        ],
        verificationCommand:
          'npm run ward -- -- /src/brokers/auth/auth-broker.ts /src/brokers/auth/index.ts',
        contextInstructions: '## Instructions\nFix ward failures in the listed files.',
      });
    });
  });

  describe('blightwarden role', () => {
    it('ERROR: {role: blightwarden, quest} => throws because blightwarden work units are built inline by layer broker', () => {
      buildWorkUnitForRoleTransformerProxy();

      const quest = QuestStub();

      expect(() =>
        buildWorkUnitForRoleTransformer({
          role: 'blightwarden',
          quest,
        }),
      ).toThrow(
        'Unknown role in input: blightwarden work units are built inline by run-blightwarden-layer-broker, not via buildWorkUnitForRoleTransformer',
      );
    });
  });
});
