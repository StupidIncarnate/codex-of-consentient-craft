import {
  AbsoluteFilePathStub,
  DependencyStepStub,
  DesignDecisionStub,
  ErrorMessageStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestContractEntryStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from '../../contracts/work-unit/work-unit.stub';
import { workUnitToArgumentsTransformer } from './work-unit-to-arguments-transformer';

describe('workUnitToArgumentsTransformer', () => {
  describe('codeweaver role', () => {
    it('VALID: {codeweaver with minimal step} => returns step name and focus file', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Auth Broker',
          focusFile: { path: 'src/brokers/auth/auth-broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Step: Create Auth Broker\nFocus File: src/brokers/auth/auth-broker.ts\nAssertions:\n  - VALID: returns expected result\nQuest ID: add-auth',
      );
    });

    it('VALID: {codeweaver with exportName} => includes export name', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Auth Broker',
          exportName: 'authBroker',
          focusFile: { path: 'src/brokers/auth/auth-broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Export Name: authBroker$/mu);
    });

    it('VALID: {codeweaver with accompanyingFiles} => includes accompanying files list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Broker',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [{ path: 'src/broker.test.ts' }],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Accompanying Files:\n {2}- src\/broker\.test\.ts$/mu);
    });

    it('VALID: {codeweaver with assertions} => includes assertions list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Broker',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
          assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Assertions:\n {2}- VALID: returns result$/mu);
    });

    it('VALID: {codeweaver with related contracts} => includes contract details', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [
          QuestContractEntryStub({
            name: 'LoginCredentials',
            kind: 'data',
            properties: [{ name: 'email', type: 'EmailAddress', description: 'User email' }],
          }),
        ],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Related Contracts:\n {2}- LoginCredentials \(data\)\n {4}- email \(EmailAddress\) - User email$/mu,
      );
    });

    it('VALID: {codeweaver with related observables} => includes assertions format', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [
          FlowObservableStub({
            id: 'post-auth-login',
            type: 'api-call',
            description: 'POST /auth/login',
          }),
          FlowObservableStub({
            id: 'redirects-to-dashboard',
            type: 'ui-state',
            description: 'redirects to dashboard',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Related Observables:\n {4}- POST \/auth\/login \(api-call\)\n {4}- redirects to dashboard \(ui-state\)$/mu,
      );
    });

    it('VALID: {codeweaver with empty relatedObservables} => omits observables section', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).not.toMatch(/^Related Observables:$/u);
    });

    it('VALID: {codeweaver with uses} => includes uses list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Broker',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
          uses: ['authGuard', 'sessionBroker'],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Uses:\n {2}- authGuard\n {2}- sessionBroker$/mu);
    });

    it('VALID: {codeweaver with design decisions} => includes design decisions', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Broker',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedDesignDecisions: [
          DesignDecisionStub({
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Design Decisions:\n {2}- Use JWT for auth: Stateless authentication$/mu,
      );
    });

    it('VALID: {codeweaver with flows} => includes flows with relevant nodes', () => {
      const observable = FlowObservableStub({ id: 'obs-1' });
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Broker',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedFlows: [
          FlowStub({
            name: 'Login Flow',
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', observables: [observable] }),
            ],
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Flows:\n {2}- Login Flow \(nodes: Login Page\)$/mu);
    });

    it('VALID: {codeweaver with empty design decisions and flows} => omits those sections', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          focusFile: { path: 'src/broker.ts' },
          accompanyingFiles: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedDesignDecisions: [],
        relatedFlows: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).not.toMatch(/^Design Decisions:$/u);
      expect(result).not.toMatch(/^Flows:$/u);
    });
  });

  describe('siegemaster role', () => {
    it('VALID: {siegemaster with relatedObservables} => returns formatted assertions', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'verify-quest' }),
        relatedObservables: [
          FlowObservableStub({
            id: 'shows-success-message',
            type: 'ui-state',
            description: 'Shows success message',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Quest ID: verify-quest\n/u);
      expect(result).toMatch(/^Observable Type Reference:$/mu);
      expect(result).toMatch(/Observables:\n {4}- Shows success message \(ui-state\)$/u);
    });

    it('VALID: {siegemaster with empty relatedObservables} => returns quest ID only', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'empty-quest' }),
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Quest ID: empty-quest\n/u);
      expect(result).toMatch(/^Observable Type Reference:$/mu);
      expect(result).not.toMatch(/^Observables:$/u);
    });

    it('VALID: {siegemaster with design decisions} => includes design decisions', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedObservables: [],
        relatedDesignDecisions: [
          DesignDecisionStub({
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Design Decisions:\n {2}- Use JWT for auth: Stateless authentication$/mu,
      );
    });

    it('VALID: {siegemaster with flows} => includes flows with relevant nodes', () => {
      const observable = FlowObservableStub({ id: 'obs-1' });
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedObservables: [],
        relatedFlows: [
          FlowStub({
            name: 'Login Flow',
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', observables: [observable] }),
            ],
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Flows:\n {2}- Login Flow \(nodes: Login Page\)$/mu);
    });

    it('VALID: {siegemaster with devServerUrl} => includes dev server URL after quest ID', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedObservables: [],
        devServerUrl: 'http://localhost:3000' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Quest ID: quest-1\nDev Server URL: http:\/\/localhost:3000\n/u);
    });

    it('VALID: {siegemaster without devServerUrl} => omits dev server URL line', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).not.toMatch(/Dev Server URL:/u);
    });

    it('VALID: {siegemaster with empty design decisions and flows} => omits those sections', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedObservables: [],
        relatedDesignDecisions: [],
        relatedFlows: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).not.toMatch(/^Design Decisions:$/u);
      expect(result).not.toMatch(/^Flows:$/u);
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {lawbringer with file paths} => returns files to review', () => {
      const workUnit = LawbringerWorkUnitStub({
        filePaths: [
          AbsoluteFilePathStub({ value: '/src/broker.ts' }),
          AbsoluteFilePathStub({ value: '/src/broker.test.ts' }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Files to Review:\n  - /src/broker.ts\n  - /src/broker.test.ts');
    });

    it('EDGE: {lawbringer with empty filePaths} => returns header only with no file entries', () => {
      const workUnit = LawbringerWorkUnitStub({
        filePaths: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Files to Review:');
    });
  });

  describe('spiritmender role', () => {
    it('VALID: {spiritmender with errors} => returns file paths and errors', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
        errors: [ErrorMessageStub({ value: 'Missing return type' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nErrors:\n  - Missing return type\nRun npm run ward on the files to verify fixes.',
      );
    });

    it('VALID: {spiritmender with empty errors array} => returns file paths without errors section', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
        errors: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/file.ts\nRun npm run ward on the files to verify fixes.',
      );
    });

    it('VALID: {spiritmender with errors field omitted} => returns file paths without errors section', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nRun npm run ward on the files to verify fixes.',
      );
    });

    it('VALID: {spiritmender with verificationCommand} => uses verification command instead of hardcoded ward', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
        verificationCommand: 'npm run build --workspace=@dungeonmaster/shared' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nVerification Command: npm run build --workspace=@dungeonmaster/shared',
      );
    });

    it('VALID: {spiritmender with verificationCommand and errors} => includes errors and verification command', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
        errors: [ErrorMessageStub({ value: 'Build failed' })],
        verificationCommand: 'npm run build' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nErrors:\n  - Build failed\nVerification Command: npm run build',
      );
    });
  });

  describe('pathseeker role', () => {
    it('VALID: {pathseeker} => returns quest ID', () => {
      const workUnit = PathseekerWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Quest ID: my-quest');
    });

    it('VALID: {pathseeker with failureContext} => returns quest ID and failure context', () => {
      const workUnit = PathseekerWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        failureContext: 'FAILED OBSERVABLES:\n- modal-visible: Modal not rendered' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Quest ID: my-quest\n\nFAILURE CONTEXT:\nFAILED OBSERVABLES:\n- modal-visible: Modal not rendered',
      );
    });

    it('VALID: {pathseeker without failureContext} => omits failure context section', () => {
      const workUnit = PathseekerWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).not.toMatch(/^FAILURE CONTEXT$/u);
    });
  });
});
