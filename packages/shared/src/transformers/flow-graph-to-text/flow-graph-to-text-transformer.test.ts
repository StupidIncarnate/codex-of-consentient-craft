import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowEdgeStub } from '../../contracts/flow-edge/flow-edge.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { flowGraphToTextTransformer } from './flow-graph-to-text-transformer';

describe('flowGraphToTextTransformer', () => {
  describe('single node', () => {
    it('VALID: {flow: single node no edges} => renders node with terminal', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({ id: 'login-page' as never, label: 'Login Page' as never, type: 'state' }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual(['[#login-page] Login Page (state)', '  (terminal)']);
    });
  });

  describe('linear chain', () => {
    it('VALID: {flow: two connected nodes} => renders depth-first walk', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({ id: 'login-page' as never, label: 'Login' as never, type: 'state' }),
          FlowNodeStub({ id: 'dashboard' as never, label: 'Dashboard' as never, type: 'state' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'login-page' as never,
            to: 'dashboard' as never,
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] Login (state)',
        '  \u2192[#dashboard]',
        '  [#dashboard] Dashboard (state)',
        '    (terminal)',
      ]);
    });
  });

  describe('labeled edges', () => {
    it('VALID: {flow: edge with label} => renders label in quotes', () => {
      const flow = FlowStub({
        entryPoint: 'check' as never,
        nodes: [
          FlowNodeStub({ id: 'check' as never, label: 'Check' as never, type: 'decision' }),
          FlowNodeStub({ id: 'success' as never, label: 'Success' as never, type: 'terminal' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'check' as never,
            to: 'success' as never,
            label: 'yes' as never,
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#check] Check (decision)',
        '  \u2192"yes" [#success]',
        '  [#success] Success (terminal)',
        '    (terminal)',
      ]);
    });
  });

  describe('back-references', () => {
    it('VALID: {flow: cycle with back edge} => renders back-reference marker', () => {
      const flow = FlowStub({
        entryPoint: 'start' as never,
        nodes: [
          FlowNodeStub({ id: 'start' as never, label: 'Start' as never, type: 'state' }),
          FlowNodeStub({ id: 'middle' as never, label: 'Middle' as never, type: 'action' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'start' as never, to: 'middle' as never }),
          FlowEdgeStub({ id: 'e-two' as never, from: 'middle' as never, to: 'start' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] Start (state)',
        '  \u2192[#middle]',
        '  [#middle] Middle (action)',
        '    \u2192 [#start] \u21A9',
      ]);
    });
  });

  describe('merge nodes', () => {
    it('VALID: {flow: node with multiple incoming edges} => shows MERGE marker', () => {
      const flow = FlowStub({
        entryPoint: 'a' as never,
        nodes: [
          FlowNodeStub({ id: 'a' as never, label: 'A' as never, type: 'state' }),
          FlowNodeStub({ id: 'b' as never, label: 'B' as never, type: 'state' }),
          FlowNodeStub({ id: 'c' as never, label: 'C' as never, type: 'state' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'a' as never, to: 'c' as never }),
          FlowEdgeStub({ id: 'e-two' as never, from: 'b' as never, to: 'c' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result[0]).toBe('[#a] A (state)');
      expect(result).toStrictEqual([
        '[#a] A (state)',
        '  \u2192[#c]',
        '  [#c] C (state) \u2190 MERGE',
        '    (terminal)',
        '[#b] B (state)',
        '  \u2192 [#c] \u21A9',
      ]);
    });
  });

  describe('cross-flow references', () => {
    it('VALID: {flow: edge to node not in current flow} => renders cross-flow marker', () => {
      const flow = FlowStub({
        entryPoint: 'start' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never, type: 'state' })],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'start' as never, to: 'other-node' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] Start (state)',
        '  \u2192 other-node \u2197 cross-flow',
      ]);
    });
  });

  describe('observables', () => {
    it('VALID: {flow: node with observables} => renders observable lines', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'shows-form' as never,
                description: 'shows login form' as never,
                type: 'ui-state',
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] Login (state)',
        '  > #shows-form: shows login form [ui-state]',
        '  (terminal)',
      ]);
    });
  });

  describe('empty flow', () => {
    it('EMPTY: {flow: no nodes} => returns empty array', () => {
      const flow = FlowStub({ nodes: [], edges: [] });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([]);
    });
  });
});
