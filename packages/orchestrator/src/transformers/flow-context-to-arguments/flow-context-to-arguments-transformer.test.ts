import {
  DesignDecisionStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestIdStub,
  StepFileReferenceStub,
} from '@dungeonmaster/shared/contracts';

import { DevCommandStub } from '../../contracts/dev-command/dev-command.stub';
import { DevServerUrlStub } from '../../contracts/dev-server-url/dev-server-url.stub';
import { flowContextToArgumentsTransformer } from './flow-context-to-arguments-transformer';

const OBSERVABLE_TYPE_REFERENCE_BLOCK =
  '\nObservable Type Reference:\n  - `api-call` — Assert an HTTP request was made with correct method/path/body\n  - `file-exists` — Assert a file/directory exists or was removed on disk\n  - `environment` — Assert environment variables or runtime config are set correctly\n  - `log-output` — Assert specific log lines were written to stdout/stderr\n  - `process-state` — Assert a process is running, exited, or in expected state\n  - `performance` — Assert response time or throughput meets threshold\n  - `ui-state` — Assert visible DOM state (element exists, text content, disabled state, CSS)\n  - `cache-state` — Assert cache entries exist, expired, or were invalidated\n  - `db-query` — Assert database rows were created, updated, or deleted\n  - `queue-message` — Assert a message was enqueued or dequeued\n  - `external-api` — Assert an outbound call to a third-party API was made correctly\n  - `custom` — Project-specific assertion — read the description for details';

describe('flowContextToArgumentsTransformer', () => {
  it('VALID: {flow with node, observable, edge, design decision, focusFiles, dev server} => renders full block', () => {
    const result = flowContextToArgumentsTransformer({
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
        edges: [FlowEdgeStub({ from: 'login-page', to: 'dashboard', label: 'success' })],
      }),
      relatedDesignDecisions: [
        DesignDecisionStub({ title: 'Use JWT for auth', rationale: 'Stateless authentication' }),
      ],
      focusFiles: [StepFileReferenceStub({ path: '/src/flows/login-flow.ts' }).path],
      devServerUrl: DevServerUrlStub({ value: 'http://localhost:3000' }),
      devCommand: DevCommandStub({ value: 'npm run dev' }),
    });

    expect(result).toBe(
      `Quest ID: verify-quest\nFlow: Login Flow\n  flowType: runtime\n  entryPoint: /login\nNodes:\n  - login-page "Login Page" [type: state]\n    Observables:\n      - shows-success-message (ui-state) Shows success message\nEdges:\n  - login-page --[success]--> dashboard\nDesign Decisions:\n  - Use JWT for auth: Stateless authentication\nFocus Files:\n  - /src/flows/login-flow.ts\nDev Server URL: http://localhost:3000\nDev Command: npm run dev\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
    );
  });

  it('EMPTY: {flow with no nodes/edges/design-decisions, no focusFiles, no dev server} => renders header + type reference only', () => {
    const result = flowContextToArgumentsTransformer({
      questId: QuestIdStub({ value: 'quest-1' }),
      flow: FlowStub({
        id: 'op-flow',
        name: 'Op Flow',
        flowType: 'operational',
        entryPoint: 'npm run sweep',
        nodes: [],
        edges: [],
      }),
      relatedDesignDecisions: [],
    });

    expect(result).toBe(
      `Quest ID: quest-1\nFlow: Op Flow\n  flowType: operational\n  entryPoint: npm run sweep\n${OBSERVABLE_TYPE_REFERENCE_BLOCK}`,
    );
  });
});
