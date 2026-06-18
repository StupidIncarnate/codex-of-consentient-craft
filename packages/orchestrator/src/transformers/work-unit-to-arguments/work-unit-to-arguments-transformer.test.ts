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
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import {
  BlightwardenWorkUnitStub,
  CodeweaverWorkUnitStub,
  FlowriderWorkUnitStub,
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
        steps: [
          DependencyStepStub({
            name: 'Create Auth Broker',
            focusFile: { path: 'src/brokers/auth/auth-broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
        steps: [
          DependencyStepStub({
            name: 'Create Auth Broker',
            exportName: 'authBroker',
            focusFile: { path: 'src/brokers/auth/auth-broker.ts' },
            accompanyingFiles: [],
          }),
        ],
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Export Name: authBroker$/mu);
    });

    it('VALID: {codeweaver with accompanyingFiles} => includes accompanying files list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        steps: [
          DependencyStepStub({
            name: 'Create Broker',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [{ path: 'src/broker.test.ts' }],
          }),
        ],
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Accompanying Files:\n {2}- src\/broker\.test\.ts$/mu);
    });

    it('VALID: {codeweaver with assertions} => includes assertions list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        steps: [
          DependencyStepStub({
            name: 'Create Broker',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
          }),
        ],
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Assertions:\n {2}- VALID: returns result$/mu);
    });

    it('VALID: {codeweaver with related contracts} => includes contract details', () => {
      const workUnit = CodeweaverWorkUnitStub({
        steps: [
          DependencyStepStub({
            name: 'Step',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
        steps: [
          DependencyStepStub({
            name: 'Step',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
        steps: [
          DependencyStepStub({
            name: 'Step',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
        steps: [
          DependencyStepStub({
            name: 'Create Broker',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
            uses: ['authGuard', 'sessionBroker'],
          }),
        ],
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/^Uses:\n {2}- authGuard\n {2}- sessionBroker$/mu);
    });

    it('VALID: {codeweaver with design decisions} => includes design decisions', () => {
      const workUnit = CodeweaverWorkUnitStub({
        steps: [
          DependencyStepStub({
            name: 'Create Broker',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
        steps: [
          DependencyStepStub({
            name: 'Create Broker',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
        steps: [
          DependencyStepStub({
            name: 'Step',
            focusFile: { path: 'src/broker.ts' },
            accompanyingFiles: [],
          }),
        ],
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
    const OBSERVABLE_TYPE_REFERENCE_BLOCK =
      '\nObservable Type Reference:\n  - `api-call` — Assert an HTTP request was made with correct method/path/body\n  - `file-exists` — Assert a file/directory exists or was removed on disk\n  - `environment` — Assert environment variables or runtime config are set correctly\n  - `log-output` — Assert specific log lines were written to stdout/stderr\n  - `process-state` — Assert a process is running, exited, or in expected state\n  - `performance` — Assert response time or throughput meets threshold\n  - `ui-state` — Assert visible DOM state (element exists, text content, disabled state, CSS)\n  - `cache-state` — Assert cache entries exist, expired, or were invalidated\n  - `db-query` — Assert database rows were created, updated, or deleted\n  - `queue-message` — Assert a message was enqueued or dequeued\n  - `external-api` — Assert an outbound call to a third-party API was made correctly\n  - `custom` — Project-specific assertion — read the description for details';

    it('VALID: {siegemaster runtime flow with single node + observable} => renders quest, flow header, nodes with observable IDs, and type reference', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'verify-quest' }),
        flow: FlowStub({
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              label: 'Login Page',
              type: 'state',
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

      expect(result).toBe(
        `Quest ID: verify-quest\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nNodes:\n  - login-page "Login Page" [type: state]\n    Observables:\n      - shows-success-message (ui-state) Shows success message\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster operational flow with multiple nodes and multiple observables per node} => renders all nodes with observable IDs nested', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          id: 'deploy-flow',
          name: 'Deploy Flow',
          flowType: 'operational',
          entryPoint: 'npm run deploy',
          nodes: [
            FlowNodeStub({
              id: 'build',
              label: 'Build Artifact',
              type: 'action',
              observables: [
                FlowObservableStub({
                  id: 'dist-exists',
                  type: 'file-exists',
                  description: 'dist/ directory exists',
                }),
                FlowObservableStub({
                  id: 'build-log-success',
                  type: 'log-output',
                  description: 'logs "Build succeeded"',
                }),
              ],
            }),
            FlowNodeStub({
              id: 'publish',
              label: 'Publish Package',
              type: 'action',
              observables: [
                FlowObservableStub({
                  id: 'registry-call',
                  type: 'api-call',
                  description: 'POST https://registry.npmjs.org',
                }),
              ],
            }),
          ],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Deploy Flow\n  flowType: operational\n  entryPoint: npm run deploy\nNodes:\n  - build "Build Artifact" [type: action]\n    Observables:\n      - dist-exists (file-exists) dist/ directory exists\n      - build-log-success (log-output) logs "Build succeeded"\n  - publish "Publish Package" [type: action]\n    Observables:\n      - registry-call (api-call) POST https://registry.npmjs.org\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster flow with edges including labeled and unlabeled} => renders edges block with labels preserved', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              label: 'Login Page',
              type: 'state',
              observables: [],
            }),
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              type: 'state',
              observables: [],
            }),
          ],
          edges: [
            FlowEdgeStub({
              id: 'login-to-dashboard',
              from: 'login-page',
              to: 'dashboard',
              label: 'success',
            }),
            FlowEdgeStub({
              id: 'dashboard-to-login',
              from: 'dashboard',
              to: 'login-page',
            }),
          ],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nNodes:\n  - login-page "Login Page" [type: state]\n  - dashboard "Dashboard" [type: state]\nEdges:\n  - login-page --[success]--> dashboard\n  - dashboard --[]--> login-page\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster flow with no edges} => omits edges block', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster with design decisions} => renders design decisions block before dev server URL and type reference', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [],
          edges: [],
        }),
        relatedDesignDecisions: [
          DesignDecisionStub({
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nDesign Decisions:\n  - Use JWT for auth: Stateless authentication\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster with devServerUrl defined} => renders dev server URL line after design decisions', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [],
          edges: [],
        }),
        devServerUrl: 'http://localhost:3000' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nDev Server URL: http://localhost:3000\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster without devServerUrl} => omits dev server URL line', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster with node that has no observables} => renders node header without nested Observables subsection', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              label: 'Login Page',
              type: 'state',
              observables: [],
            }),
          ],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nNodes:\n  - login-page "Login Page" [type: state]\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster runtime with devServerUrl AND devCommand} => renders both Dev Server URL and Dev Command lines', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [],
          edges: [],
        }),
        devServerUrl: 'http://localhost:3737' as never,
        devCommand: 'npm run dev' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nDev Server URL: http://localhost:3737\nDev Command: npm run dev\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster operational with no dev server} => omits both Dev Server URL and Dev Command lines', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          name: 'Deploy Flow',
          flowType: 'operational',
          entryPoint: 'npm run deploy',
          nodes: [],
          edges: [],
        }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Deploy Flow\n  flowType: operational\n  entryPoint: npm run deploy\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });

    it('VALID: {siegemaster fully populated: nodes + observables + edges + design decisions + devServerUrl} => renders full block in canonical order', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'quest-1' }),
        flow: FlowStub({
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              label: 'Login Page',
              type: 'state',
              observables: [
                FlowObservableStub({
                  id: 'obs-form-visible',
                  type: 'ui-state',
                  description: 'login form is visible',
                }),
              ],
            }),
          ],
          edges: [
            FlowEdgeStub({
              id: 'login-to-dashboard',
              from: 'login-page',
              to: 'dashboard',
              label: 'success',
            }),
          ],
        }),
        relatedDesignDecisions: [
          DesignDecisionStub({
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
          }),
        ],
        devServerUrl: 'http://localhost:3000' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: quest-1\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nNodes:\n  - login-page "Login Page" [type: state]\n    Observables:\n      - obs-form-visible (ui-state) login form is visible\nEdges:\n  - login-page --[success]--> dashboard\nDesign Decisions:\n  - Use JWT for auth: Stateless authentication\nDev Server URL: http://localhost:3000\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
      );
    });
  });

  describe('flowrider role', () => {
    const OBSERVABLE_TYPE_REFERENCE_BLOCK =
      '\nObservable Type Reference:\n  - `api-call` — Assert an HTTP request was made with correct method/path/body\n  - `file-exists` — Assert a file/directory exists or was removed on disk\n  - `environment` — Assert environment variables or runtime config are set correctly\n  - `log-output` — Assert specific log lines were written to stdout/stderr\n  - `process-state` — Assert a process is running, exited, or in expected state\n  - `performance` — Assert response time or throughput meets threshold\n  - `ui-state` — Assert visible DOM state (element exists, text content, disabled state, CSS)\n  - `cache-state` — Assert cache entries exist, expired, or were invalidated\n  - `db-query` — Assert database rows were created, updated, or deleted\n  - `queue-message` — Assert a message was enqueued or dequeued\n  - `external-api` — Assert an outbound call to a third-party API was made correctly\n  - `custom` — Project-specific assertion — read the description for details';

    it('VALID: {flowrider runtime flow with node, observable, focusFiles, dev server} => renders flow context plus Focus Files block', () => {
      const workUnit = FlowriderWorkUnitStub({
        questId: QuestIdStub({ value: 'verify-quest' }),
        flow: FlowStub({
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              label: 'Login Page',
              type: 'state',
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
        focusFiles: [AbsoluteFilePathStub({ value: '/src/flows/login-flow.ts' })],
        devServerUrl: 'http://localhost:3000',
        devCommand: 'npm run dev',
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        `Quest ID: verify-quest\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nNodes:\n  - login-page "Login Page" [type: state]\n    Observables:\n      - shows-success-message (ui-state) Shows success message\nFocus Files:\n  - /src/flows/login-flow.ts\nDev Server URL: http://localhost:3000\nDev Command: npm run dev\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
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

    it('VALID: {lawbringer single pair with questId} => appends Quest ID after the file list', () => {
      const workUnit = LawbringerWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broker.ts' })],
        questId: QuestIdStub({ value: 'fix-bug' }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Files to Review:\n  - /src/broker.ts\nQuest ID: fix-bug');
    });

    it('VALID: {lawbringer multi-pair batch without questId} => returns batch header + per-pair blocks', () => {
      const workUnit = LawbringerWorkUnitStub({
        folderTypes: ['contracts', 'adapters'],
        filePaths: [
          AbsoluteFilePathStub({ value: '/a-contract.ts' }),
          AbsoluteFilePathStub({ value: '/b-adapter.ts' }),
        ],
        stepBoundaries: [
          {
            stepId: StepIdStub({ value: 'pair-1' }),
            filePaths: [AbsoluteFilePathStub({ value: '/a-contract.ts' })],
          },
          {
            stepId: StepIdStub({ value: 'pair-2' }),
            filePaths: [AbsoluteFilePathStub({ value: '/b-adapter.ts' })],
          },
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        '# Batch: 2 file pair(s), folder types: [contracts, adapters]\n\n--- Pair 1 of 2 (step: pair-1) ---\n  - /a-contract.ts\n\n--- Pair 2 of 2 (step: pair-2) ---\n  - /b-adapter.ts',
      );
    });

    it('VALID: {lawbringer multi-pair batch with questId} => appends Quest ID after the pair blocks', () => {
      const workUnit = LawbringerWorkUnitStub({
        folderTypes: ['contracts', 'adapters'],
        filePaths: [
          AbsoluteFilePathStub({ value: '/a-contract.ts' }),
          AbsoluteFilePathStub({ value: '/b-adapter.ts' }),
        ],
        stepBoundaries: [
          {
            stepId: StepIdStub({ value: 'pair-1' }),
            filePaths: [AbsoluteFilePathStub({ value: '/a-contract.ts' })],
          },
          {
            stepId: StepIdStub({ value: 'pair-2' }),
            filePaths: [AbsoluteFilePathStub({ value: '/b-adapter.ts' })],
          },
        ],
        questId: QuestIdStub({ value: 'fix-bug' }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        '# Batch: 2 file pair(s), folder types: [contracts, adapters]\n\n--- Pair 1 of 2 (step: pair-1) ---\n  - /a-contract.ts\n\n--- Pair 2 of 2 (step: pair-2) ---\n  - /b-adapter.ts\nQuest ID: fix-bug',
      );
    });

    it('EDGE: {lawbringer with empty filePaths} => returns header only with no file entries', () => {
      const workUnit = LawbringerWorkUnitStub({
        filePaths: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Files to Review:');
    });

    it('VALID: {lawbringer reviewMode whole-diff} => returns whole-diff instructions + Quest ID', () => {
      const workUnit = LawbringerWorkUnitStub({
        reviewMode: 'whole-diff',
        questId: QuestIdStub({ value: 'fix-bug' }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Review Mode: whole-diff\nReview the entire branch diff: run `git diff <main-or-master>...HEAD --name-only` (diff against your repo default branch — main or master, whichever exists), then read and review every changed non-test file alongside its test.\nQuest ID: fix-bug',
      );
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

    it('VALID: {spiritmender batch: multiple filePaths + errors + verificationCommand + contextInstructions} => renders all four sections', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [
          AbsoluteFilePathStub({ value: '/src/broker.ts' }),
          AbsoluteFilePathStub({ value: '/src/transformer.ts' }),
        ],
        errors: [
          ErrorMessageStub({ value: 'Missing return type on broker' }),
          ErrorMessageStub({ value: 'Unused import in transformer' }),
        ],
        verificationCommand: 'npm run ward -- -- /src/broker.ts /src/transformer.ts' as never,
        contextInstructions: '## Ward Failure\nFix the lint and typecheck errors.' as never,
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        '## Ward Failure\nFix the lint and typecheck errors.\n\nFiles:\n  - /src/broker.ts\n  - /src/transformer.ts\nErrors:\n  - Missing return type on broker\n  - Unused import in transformer\nVerification Command: npm run ward -- -- /src/broker.ts /src/transformer.ts',
      );
    });

    it('VALID: {spiritmender without contextInstructions} => no preamble before files', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nRun npm run ward on the files to verify fixes.',
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

      expect(result).toBe('Quest ID: my-quest');
    });

    it('VALID: {pathseeker with slice} => returns quest ID and slice details', () => {
      const workUnit = PathseekerWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        slice: {
          name: 'orchestrator' as never,
          packages: ['orchestrator' as never],
          flowIds: ['login-flow' as never, 'logout-flow' as never],
        },
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Quest ID: my-quest\nSlice: orchestrator\nPackages: orchestrator\nFlow IDs: login-flow, logout-flow',
      );
    });
  });

  describe('blightwarden role', () => {
    it('VALID: {blightwarden minimal} => returns quest ID only', () => {
      const workUnit = BlightwardenWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        relatedDesignDecisions: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Quest ID: my-quest');
    });

    it('VALID: {blightwarden with scopeSize: small} => includes scope size line', () => {
      const workUnit = BlightwardenWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        scopeSize: 'small',
        relatedDesignDecisions: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Quest ID: my-quest\nScope Size: small');
    });

    it('VALID: {blightwarden with scopeSize: medium} => includes scope size line', () => {
      const workUnit = BlightwardenWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        scopeSize: 'medium',
        relatedDesignDecisions: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Quest ID: my-quest\nScope Size: medium');
    });

    it('VALID: {blightwarden with design decisions} => includes design decisions block', () => {
      const workUnit = BlightwardenWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        relatedDesignDecisions: [
          DesignDecisionStub({
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Quest ID: my-quest\nDesign Decisions:\n  - Use JWT for auth: Stateless authentication',
      );
    });

    it('VALID: {blightwarden with scopeSize + design decisions} => renders scope size then design decisions', () => {
      const workUnit = BlightwardenWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
        scopeSize: 'large',
        relatedDesignDecisions: [
          DesignDecisionStub({
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
          }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Quest ID: my-quest\nScope Size: large\nDesign Decisions:\n  - Use JWT for auth: Stateless authentication',
      );
    });
  });
});
