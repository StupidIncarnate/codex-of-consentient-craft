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
    it('VALID: node with observables => green style', () => {
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
          '  login-page[Login Page]',
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
          '  login-page[Login Page]',
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
          '  login-page[Login Page]',
          '  style login-page fill:#2d6a4f,color:#fff',
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
          '  check-auth{Authenticated?}',
          '  login(Login)',
          '  dashboard[Dashboard]',
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
