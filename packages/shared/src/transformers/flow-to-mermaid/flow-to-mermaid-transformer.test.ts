import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowEdgeStub } from '../../contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';
import { QuestContractPropertyStub } from '../../contracts/quest-contract-property/quest-contract-property.stub';

import { flowToMermaidTransformer } from './flow-to-mermaid-transformer';

describe('flowToMermaidTransformer', () => {
  describe('empty flow', () => {
    it('EMPTY: {nodes: [], edges: []} => returns flowchart TD header only', () => {
      const flow = FlowStub({ nodes: [], edges: [] });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe('flowchart TD');
    });
  });

  describe('node shapes', () => {
    it('VALID: {type: decision} => renders diamond syntax', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'check-auth', label: 'Authenticated?', type: 'decision' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  check-auth{Authenticated?}'].join('\n'));
    });

    it('VALID: {type: state} => renders rectangle syntax', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  login-page[Login Page]'].join('\n'));
    });

    it('VALID: {type: action} => renders rounded rectangle syntax', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'submit-form', label: 'Submit Form', type: 'action' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  submit-form(Submit Form)',
          '  style submit-form fill:#1971c2,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {type: terminal} => renders circle syntax', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'done', label: 'End', type: 'terminal' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  done((End))', '  style done fill:#c92a2a,color:#fff'].join('\n'),
      );
    });

    it('VALID: {type: terminal, id: "end"} => sanitizes reserved keyword', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'end', label: 'End', type: 'terminal' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  _end((End))', '  style _end fill:#c92a2a,color:#fff'].join('\n'),
      );
    });

    it('VALID: {type: terminal, label with parens} => escapes parentheses in label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'delete-failed',
            label: 'Delete failed (error displayed)',
            type: 'terminal',
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  delete-failed((Delete failed #40;error displayed#41;))',
          '  style delete-failed fill:#c92a2a,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {type: action, label with parens} => escapes parentheses in label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'call-api',
            label: 'Call API (retry)',
            type: 'action',
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  call-api(Call API #40;retry#41;)',
          '  style call-api fill:#1971c2,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {type: decision, label with braces} => escapes braces in label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'check-config',
            label: 'Config {valid}?',
            type: 'decision',
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  check-config{Config #123;valid#125;?}'].join('\n'));
    });
  });

  describe('edge rendering', () => {
    it('VALID: {from, to} => renders simple arrow', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'start', label: 'Start', type: 'state' }),
          FlowNodeStub({ id: 'end', label: 'End', type: 'terminal' }),
        ],
        edges: [FlowEdgeStub({ id: 'start-to-end', from: 'start', to: 'end' })],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  start[Start]',
          '  _end((End))',
          '  start --> _end',
          '  style _end fill:#c92a2a,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {from, to, label} => renders labeled arrow', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'check', label: 'Check', type: 'decision' }),
          FlowNodeStub({ id: 'ok', label: 'OK', type: 'state' }),
        ],
        edges: [FlowEdgeStub({ id: 'check-to-ok', from: 'check', to: 'ok', label: 'yes' })],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  check{Check}', '  ok[OK]', '  check -->|yes| ok'].join('\n'),
      );
    });

    it('VALID: {from, to, label with parens} => escapes parentheses in edge label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'api-result', label: 'API Result', type: 'decision' }),
          FlowNodeStub({ id: 'delete-failed', label: 'Delete Failed', type: 'terminal' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'api-to-fail',
            from: 'api-result',
            to: 'delete-failed',
            label: 'Error (404/500)',
          }),
        ],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  api-result{API Result}',
          '  delete-failed((Delete Failed))',
          '  api-result -->|Error #40;404/500#41;| delete-failed',
          '  style delete-failed fill:#c92a2a,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {from, to, label with pipe} => escapes pipe in edge label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'check', label: 'Check', type: 'decision' }),
          FlowNodeStub({ id: 'next', label: 'Next', type: 'state' }),
        ],
        edges: [FlowEdgeStub({ id: 'check-to-next', from: 'check', to: 'next', label: 'yes|no' })],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  check{Check}', '  next[Next]', '  check -->|yes#124;no| next'].join(
          '\n',
        ),
      );
    });

    it('VALID: {from, to, label with quotes} => escapes quotes in edge label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'check', label: 'Check', type: 'decision' }),
          FlowNodeStub({ id: 'next', label: 'Next', type: 'state' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'check-to-next', from: 'check', to: 'next', label: 'status "OK"' }),
        ],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  check{Check}',
          '  next[Next]',
          '  check -->|status #34;OK#34;| next',
        ].join('\n'),
      );
    });

    it('VALID: {node label with pipe} => escapes pipe in node label', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'choice', label: 'A|B', type: 'state' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  choice[A#124;B]'].join('\n'));
    });

    it('VALID: {node label with quotes} => escapes quotes in node label', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'msg', label: 'Show "error"', type: 'action' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  msg(Show #34;error#34;)', '  style msg fill:#1971c2,color:#fff'].join(
          '\n',
        ),
      );
    });

    it('VALID: cross-flow ref => strips flowId prefix', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'start', label: 'Start', type: 'state' })],
        edges: [
          FlowEdgeStub({
            id: 'start-to-target',
            from: 'start',
            to: 'login-flow:target-node',
          }),
        ],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  start[Start]', '  start --> target-node'].join('\n'));
    });
  });

  describe('node styling', () => {
    it('VALID: node with observables => green style and assertions in label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            type: 'state',
            observables: [FlowObservableStub()],
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  login-page["<b>Login Page</b><br/><small>· redirects to dashboard</small>"]',
          '  style login-page fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: action without observables => blue style', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'do-thing', label: 'Do Thing', type: 'action' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  do-thing(Do Thing)', '  style do-thing fill:#1971c2,color:#fff'].join(
          '\n',
        ),
      );
    });

    it('VALID: terminal without observables => red style', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'fail', label: 'Fail', type: 'terminal' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  fail((Fail))', '  style fail fill:#c92a2a,color:#fff'].join('\n'),
      );
    });

    it('VALID: state without observables => no style', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'idle', label: 'Idle', type: 'state' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  idle[Idle]'].join('\n'));
    });

    it('VALID: decision without observables => no style', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'is-valid', label: 'Valid?', type: 'decision' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  is-valid{Valid?}'].join('\n'));
    });
  });

  describe('click links', () => {
    it('VALID: observable with designRef => renders click href', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            type: 'state',
            observables: [FlowObservableStub({ designRef: 'https://figma.com/design/123' })],
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  login-page["<b>Login Page</b><br/><small>· redirects to dashboard</small>"]',
          '  style login-page fill:#2d6a4f,color:#fff',
          '  click login-page href "https://figma.com/design/123" _blank',
        ].join('\n'),
      );
    });

    it('VALID: observables without designRef => no click link', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            type: 'state',
            observables: [FlowObservableStub()],
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  login-page["<b>Login Page</b><br/><small>· redirects to dashboard</small>"]',
          '  style login-page fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });
  });

  describe('assertion rendering', () => {
    it('VALID: node with multiple observables => renders all descriptions in label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'shows-login-form',
                type: 'ui-state',
                description: 'shows login form',
              }),
              FlowObservableStub({
                id: 'disables-submit-button',
                type: 'ui-state',
                description: 'disables submit button',
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  login-page["<b>Login Page</b><br/><small>· shows login form</small><br/><small>· disables submit button</small>"]',
          '  style login-page fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: long assertion description => truncated at 200 chars', () => {
      const longDescription = 'a'.repeat(201);
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'page',
            label: 'Page',
            type: 'state',
            observables: [
              FlowObservableStub({
                description: longDescription,
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          `  page["<b>Page</b><br/><small>· ${'a'.repeat(200)}...</small>"]`,
          '  style page fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: multiple observables on one node => renders all descriptions', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'shows-welcome-message',
                type: 'ui-state',
                description: 'shows welcome message',
              }),
              FlowObservableStub({
                id: 'loads-user-data',
                type: 'ui-state',
                description: 'loads user data',
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  dashboard["<b>Dashboard</b><br/><small>· shows welcome message</small><br/><small>· loads user data</small>"]',
          '  style dashboard fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });
  });

  describe('complex flow', () => {
    it('VALID: multi-node flow => renders complete diagram', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'start', label: 'Start', type: 'state' }),
          FlowNodeStub({
            id: 'check-auth',
            label: 'Authenticated?',
            type: 'decision',
            observables: [FlowObservableStub({ designRef: 'https://docs.example.com/auth' })],
          }),
          FlowNodeStub({ id: 'login', label: 'Login', type: 'action' }),
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            type: 'state',
            observables: [FlowObservableStub()],
          }),
          FlowNodeStub({ id: 'error', label: 'Error', type: 'terminal' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'start-to-check', from: 'start', to: 'check-auth' }),
          FlowEdgeStub({
            id: 'check-to-dashboard',
            from: 'check-auth',
            to: 'dashboard',
            label: 'yes',
          }),
          FlowEdgeStub({ id: 'check-to-login', from: 'check-auth', to: 'login', label: 'no' }),
          FlowEdgeStub({ id: 'login-to-dashboard', from: 'login', to: 'dashboard' }),
          FlowEdgeStub({ id: 'login-to-error', from: 'login', to: 'error', label: 'fail' }),
        ],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  start[Start]',
          '  check-auth["<b>Authenticated?</b><br/><small>· redirects to dashboard</small>"]',
          '  login(Login)',
          '  dashboard["<b>Dashboard</b><br/><small>· redirects to dashboard</small>"]',
          '  error((Error))',
          '  start --> check-auth',
          '  check-auth -->|yes| dashboard',
          '  check-auth -->|no| login',
          '  login --> dashboard',
          '  login -->|fail| error',
          '  style check-auth fill:#2d6a4f,color:#fff',
          '  style login fill:#1971c2,color:#fff',
          '  style dashboard fill:#2d6a4f,color:#fff',
          '  style error fill:#c92a2a,color:#fff',
          '  click check-auth href "https://docs.example.com/auth" _blank',
        ].join('\n'),
      );
    });
  });

  describe('contract rendering', () => {
    it('VALID: {node with linked contract} => renders contract details on node', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'submit-form', label: 'Submit Form', type: 'action' })],
        edges: [],
      });
      const contracts = [
        QuestContractEntryStub({
          name: 'LoginCredentials',
          nodeId: 'submit-form',
          properties: [
            QuestContractPropertyStub({
              name: 'email',
              type: 'EmailAddress',
              description: 'User email',
            }),
          ],
        }),
      ];

      const result = flowToMermaidTransformer({ flow, contracts });

      expect(result).toBe(
        [
          'flowchart TD',
          '  submit-form["<b>Submit Form</b><br/><small>#91;LoginCredentials#93;</small><br/><small>&nbsp;&nbsp;email: EmailAddress</small>"]',
          '  style submit-form fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {node with observables AND contracts} => renders both', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'submit-form',
            label: 'Submit Form',
            type: 'action',
            observables: [
              FlowObservableStub({
                id: 'sends-post',
                type: 'ui-state',
                description: 'sends POST request',
              }),
            ],
          }),
        ],
        edges: [],
      });
      const contracts = [
        QuestContractEntryStub({
          name: 'LoginCredentials',
          nodeId: 'submit-form',
          properties: [
            QuestContractPropertyStub({
              name: 'email',
              type: 'EmailAddress',
              description: 'User email',
            }),
          ],
        }),
      ];

      const result = flowToMermaidTransformer({ flow, contracts });

      expect(result).toBe(
        [
          'flowchart TD',
          '  submit-form["<b>Submit Form</b><br/><small>· sends POST request</small><br/><small>#91;LoginCredentials#93;</small><br/><small>&nbsp;&nbsp;email: EmailAddress</small>"]',
          '  style submit-form fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('EDGE: {contracts omitted} => backward compatible, no contract lines', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'idle', label: 'Idle', type: 'state' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(['flowchart TD', '  idle[Idle]'].join('\n'));
    });

    it('EDGE: {contract with no matching nodeId} => node renders without contract', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'idle', label: 'Idle', type: 'state' })],
        edges: [],
      });
      const contracts = [
        QuestContractEntryStub({
          name: 'Unlinked',
          nodeId: 'other-node',
          properties: [
            QuestContractPropertyStub({
              name: 'field',
              type: 'FieldType',
              description: 'A field',
            }),
          ],
        }),
      ];

      const result = flowToMermaidTransformer({ flow, contracts });

      expect(result).toBe(['flowchart TD', '  idle[Idle]'].join('\n'));
    });

    it('VALID: {contract with value property} => renders = value', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'api-call', label: 'Call API', type: 'action' })],
        edges: [],
      });
      const contracts = [
        QuestContractEntryStub({
          name: 'DeleteEndpoint',
          nodeId: 'api-call',
          properties: [
            QuestContractPropertyStub({
              name: 'method',
              type: 'HttpMethod',
              value: 'DELETE',
              description: 'HTTP method',
            }),
            QuestContractPropertyStub({
              name: 'path',
              type: 'UrlPath',
              value: '/api/quests/:questId',
              description: 'Endpoint path',
            }),
          ],
        }),
      ];

      const result = flowToMermaidTransformer({ flow, contracts });

      expect(result).toBe(
        [
          'flowchart TD',
          '  api-call["<b>Call API</b><br/><small>#91;DeleteEndpoint#93;</small><br/><small>&nbsp;&nbsp;method: HttpMethod = DELETE</small><br/><small>&nbsp;&nbsp;path: UrlPath = /api/quests/:questId</small>"]',
          '  style api-call fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {contract without nodeId} => not linked, node renders plain', () => {
      const flow = FlowStub({
        nodes: [FlowNodeStub({ id: 'idle', label: 'Idle', type: 'state' })],
        edges: [],
      });
      const contracts = [
        QuestContractEntryStub({
          name: 'OrphanContract',
          properties: [
            QuestContractPropertyStub({
              name: 'field',
              type: 'FieldType',
              description: 'A field',
            }),
          ],
        }),
      ];

      const result = flowToMermaidTransformer({ flow, contracts });

      expect(result).toBe(['flowchart TD', '  idle[Idle]'].join('\n'));
    });
  });
});
