import {
  AbsoluteFilePathStub,
  DependencyStepStub,
  DesignDecisionStub,
  ErrorMessageStub,
  FlowEdgeStub,
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

      expect(result).toBe(
        'Step: Step\nFocus File: src/broker.ts\nAssertions:\n  - VALID: returns expected result\nQuest ID: quest-1',
      );
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

      expect(result).toBe(
        'Step: Step\nFocus File: src/broker.ts\nAssertions:\n  - VALID: returns expected result\nQuest ID: quest-1',
      );
    });
  });

  describe('siegemaster role', () => {
    it('VALID: {siegemaster with flow and observables} => returns formatted flow with observables', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'verify-quest' }),
        flow: FlowStub({
          name: 'Login Flow',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              label: 'Login Page',
              observables: [
                FlowObservableStub({
                  id: 'shows-success-message',
                  type: 'ui-state',
                  description: 'Shows success message',
                }),
              ],
            }),
          ],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Quest ID: verify-quest\nFlow: Login Flow\n {2}Entry Point: \/login\n {2}Exit Points: \/dashboard\n/u,
      );
      expect(result).toMatch(
        /Nodes:\n {4}- Login Page \(login-page\)\n {6}- Shows success message \(ui-state\)$/mu,
      );
      expect(result).toMatch(/^Observable Type Reference:$/mu);
    });

    it('VALID: {siegemaster with empty flow nodes} => omits nodes section', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'empty-quest' }),
        flow: FlowStub({
          name: 'Empty Flow',
          entryPoint: '/start',
          exitPoints: ['/end'],
          nodes: [],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Quest ID: empty-quest\n/u);
      expect(result).toMatch(/^Flow: Empty Flow$/mu);
      expect(result).toMatch(/^ {2}Exit Points: \/end\nObservable Type Reference:$/mu);
    });

    it('VALID: {siegemaster with edges} => includes edges with labels', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Auth Flow',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
          nodes: [
            FlowNodeStub({ id: 'login-page', label: 'Login Page' }),
            FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
          ],
          edges: [
            FlowEdgeStub({
              id: 'login-to-dash',
              from: 'login-page',
              to: 'dashboard',
              label: 'success',
            }),
          ],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^ {2}Edges:\n {4}- login-page → dashboard \[success\]$/mu);
    });

    it('VALID: {siegemaster with edges without labels} => includes edges without label suffix', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Auth Flow',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
          nodes: [],
          edges: [FlowEdgeStub({ id: 'login-to-dash', from: 'login-page', to: 'dashboard' })],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/Edges:\n {4}- login-page → dashboard$/mu);
    });

    it('VALID: {siegemaster with design decisions} => includes design decisions', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        designDecisions: [
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

    it('VALID: {siegemaster with contracts} => includes contract details', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        contracts: [
          QuestContractEntryStub({
            name: 'LoginCredentials',
            kind: 'data',
            properties: [{ name: 'email', type: 'EmailAddress', description: 'User email' }],
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Contracts:\n {2}- LoginCredentials \(data\)\n {4}- email \(EmailAddress\) - User email$/mu,
      );
    });

    it('VALID: {siegemaster with empty design decisions and contracts} => omits those sections', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        designDecisions: [],
        contracts: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Observable Type Reference:\n(?:\s{2}- .+\n?)+$/mu);
    });

    it('EDGE: {siegemaster with all empty collections} => only quest ID, flow metadata, and type reference', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'minimal-quest' }),
        flow: FlowStub({
          name: 'Minimal Flow',
          entryPoint: '/start',
          exitPoints: ['/end'],
          nodes: [],
          edges: [],
        }),
        designDecisions: [],
        contracts: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Quest ID: minimal-quest\nFlow: Minimal Flow\n {2}Entry Point: \/start\n {2}Exit Points: \/end\nObservable Type Reference:\n(?:\s{2}- .+\n?)+$/u,
      );
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

    it('VALID: {spiritmender with contextInstructions} => prepends instructions before files', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
        errors: [ErrorMessageStub({ value: 'Build failed' })],
        verificationCommand: 'npm run build' as never,
        contextInstructions: '## Instructions\nFix the build.' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        '## Instructions\nFix the build.\n\nFiles:\n  - /src/broken.ts\nErrors:\n  - Build failed\nVerification Command: npm run build',
      );
    });

    it('VALID: {spiritmender without contextInstructions} => no preamble before files', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Files:/u);
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

      expect(result).toBe('Quest ID: my-quest');
    });
  });
});
