import { FlowEdgeStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { questDuplicateFlowEdgeIdsTransformer } from './quest-duplicate-flow-edge-ids-transformer';

describe('questDuplicateFlowEdgeIdsTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique edge ids} => returns []', () => {
      const flow = FlowStub({
        edges: [
          FlowEdgeStub({ id: 'e1' as never, from: 'a' as never, to: 'b' as never }),
          FlowEdgeStub({ id: 'e2' as never, from: 'b' as never, to: 'c' as never }),
        ],
      });

      const result = questDuplicateFlowEdgeIdsTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates in one flow', () => {
    it('INVALID: {two edges share id} => returns description with flow id and edge ids', () => {
      const flow = FlowStub({
        id: 'login-flow' as never,
        edges: [
          FlowEdgeStub({ id: 'same-edge' as never, from: 'a' as never, to: 'b' as never }),
          FlowEdgeStub({ id: 'same-edge' as never, from: 'b' as never, to: 'a' as never }),
        ],
      });

      const result = questDuplicateFlowEdgeIdsTransformer({ flows: [flow] });

      expect(result).toStrictEqual(["flow 'login-flow': duplicate edges 'same-edge'"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined} => returns []', () => {
      const result = questDuplicateFlowEdgeIdsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
