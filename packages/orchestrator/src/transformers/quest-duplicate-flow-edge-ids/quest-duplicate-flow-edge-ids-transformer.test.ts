import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';

import { questDuplicateFlowEdgeIdsTransformer } from './quest-duplicate-flow-edge-ids-transformer';

describe('questDuplicateFlowEdgeIdsTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique edge ids} => returns []', () => {
      const flow = FlowStub({
        edges: [
          FlowEdgeStub({ id: 'e1', from: 'a', to: 'b' }),
          FlowEdgeStub({ id: 'e2', from: 'b', to: 'c' }),
        ],
      });

      const result = questDuplicateFlowEdgeIdsTransformer({ flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates in one flow', () => {
    it('INVALID: {two edges share id} => returns description with flow id and edge ids', () => {
      const flow = FlowStub({
        id: 'login-flow',
        edges: [
          FlowEdgeStub({ id: 'same-edge', from: 'a', to: 'b' }),
          FlowEdgeStub({ id: 'same-edge', from: 'b', to: 'a' }),
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
