import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questTerminalNodesMissingObservablesTransformer } from './quest-terminal-nodes-missing-observables-transformer';

describe('questTerminalNodesMissingObservablesTransformer', () => {
  describe('terminal nodes have observables', () => {
    it('VALID: {terminal has observables} => returns []', () => {
      const node = FlowNodeStub({
        id: 'done',
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
        id: 'bare-end',
        type: 'terminal',
        observables: [],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });

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
