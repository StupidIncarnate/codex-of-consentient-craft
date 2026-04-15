import { FlowNodeStub, FlowObservableStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDuplicateObservableIdsInNodeTransformer } from './quest-duplicate-observable-ids-in-node-transformer';

describe('questDuplicateObservableIdsInNodeTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique observable ids} => returns []', () => {
      const node = FlowNodeStub({
        id: 'n1' as never,
        observables: [
          FlowObservableStub({ id: 'obs-a' as never }),
          FlowObservableStub({ id: 'obs-b' as never }),
        ],
      });
      const flow = FlowStub({ nodes: [node] });

      const result = questDuplicateObservableIdsInNodeTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates in one node', () => {
    it('INVALID: {two observables share id in one node} => returns description', () => {
      const node = FlowNodeStub({
        id: 'node-dup' as never,
        observables: [
          FlowObservableStub({ id: 'same-obs' as never }),
          FlowObservableStub({ id: 'same-obs' as never, description: 'other' as never }),
        ],
      });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });

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
