import { FlowNodeStub, FlowObservableStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questTerminalNodesMissingObservablesTransformer } from './quest-terminal-nodes-missing-observables-transformer';

describe('questTerminalNodesMissingObservablesTransformer', () => {
  describe('terminal nodes have observables', () => {
    it('VALID: {terminal has observables} => returns []', () => {
      const node = FlowNodeStub({
        id: 'done' as never,
        type: 'terminal',
        observables: [FlowObservableStub()],
      });
      const flow = FlowStub({ nodes: [node] });

      const result = questTerminalNodesMissingObservablesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('terminal node missing observables', () => {
    it('INVALID: {terminal has no observables} => returns description', () => {
      const node = FlowNodeStub({
        id: 'bare-end' as never,
        type: 'terminal',
        observables: [],
      });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });

      const result = questTerminalNodesMissingObservablesTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        "flow 'login-flow' terminal node 'bare-end' has no observables",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questTerminalNodesMissingObservablesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
