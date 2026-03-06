import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowEdgeStub } from '../../contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';

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
        nodes: [FlowNodeStub({ id: 'end', label: 'End', type: 'terminal' })],
        edges: [],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        ['flowchart TD', '  end((End))', '  style end fill:#c92a2a,color:#fff'].join('\n'),
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
        edges: [FlowEdgeStub({ from: 'start', to: 'end' })],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  start[Start]',
          '  end((End))',
          '  start --> end',
          '  style end fill:#c92a2a,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: {from, to, label} => renders labeled arrow', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({ id: 'check', label: 'Check', type: 'decision' }),
          FlowNodeStub({ id: 'ok', label: 'OK', type: 'state' }),
        ],
        edges: [FlowEdgeStub({ from: 'check', to: 'ok', label: 'yes' })],
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
          FlowEdgeStub({ from: 'api-result', to: 'delete-failed', label: 'Error (404/500)' }),
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
        edges: [FlowEdgeStub({ from: 'check', to: 'next', label: 'yes|no' })],
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
        edges: [FlowEdgeStub({ from: 'check', to: 'next', label: 'status "OK"' })],
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
            from: 'start',
            to: 'c23bd10b-58cc-4372-a567-0e02b2c3d479:target-node',
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
    it('VALID: node with observables => renders assertions in label', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            type: 'state',
            observables: [
              FlowObservableStub({
                then: [
                  { type: 'ui-state', description: 'shows login form' },
                  { type: 'ui-state', description: 'disables submit button' },
                ],
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

    it('VALID: long assertion description => truncated at 60 chars', () => {
      const longDescription = 'a'.repeat(61);
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'page',
            label: 'Page',
            type: 'state',
            observables: [
              FlowObservableStub({
                then: [{ type: 'ui-state', description: longDescription }],
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
          `  page["<b>Page</b><br/><small>· ${'a'.repeat(60)}...</small>"]`,
          '  style page fill:#2d6a4f,color:#fff',
        ].join('\n'),
      );
    });

    it('VALID: multiple observables on one node => flattens all then entries', () => {
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                then: [{ type: 'ui-state', description: 'shows welcome message' }],
              }),
              FlowObservableStub({
                id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
                then: [{ type: 'ui-state', description: 'loads user data' }],
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
          FlowEdgeStub({ from: 'start', to: 'check-auth' }),
          FlowEdgeStub({ from: 'check-auth', to: 'dashboard', label: 'yes' }),
          FlowEdgeStub({ from: 'check-auth', to: 'login', label: 'no' }),
          FlowEdgeStub({ from: 'login', to: 'dashboard' }),
          FlowEdgeStub({ from: 'login', to: 'error', label: 'fail' }),
        ],
      });

      const result = flowToMermaidTransformer({ flow });

      expect(result).toBe(
        [
          'flowchart TD',
          '  start[Start]',
          '  check-auth{"<b>Authenticated?</b><br/><small>· redirects to dashboard</small>"}',
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
});
