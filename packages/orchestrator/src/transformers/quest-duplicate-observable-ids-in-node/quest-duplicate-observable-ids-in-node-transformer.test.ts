import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDuplicateObservableIdsInNodeTransformer } from './quest-duplicate-observable-ids-in-node-transformer';

describe('questDuplicateObservableIdsInNodeTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique observable ids} => returns []', () => {
      const node = FlowNodeStub({
        id: 'n1',
        observables: [FlowObservableStub({ id: 'obs-a' }), FlowObservableStub({ id: 'obs-b' })],
      });
      const flow = FlowStub({ nodes: [node] });

      const result = questDuplicateObservableIdsInNodeTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates in one node', () => {
    it('INVALID: {two observables share id in one node} => returns description', () => {
      const node = FlowNodeStub({
        id: 'node-dup',
        observables: [
          FlowObservableStub({ id: 'same-obs' }),
          FlowObservableStub({ id: 'same-obs', description: 'other' }),
        ],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });

      const result = questDuplicateObservableIdsInNodeTransformer({ flows: [flow] });

      expect(result).toStrictEqual([
        "flow 'login-flow' node 'node-dup': duplicate observables 'same-obs'",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDuplicateObservableIdsInNodeTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
