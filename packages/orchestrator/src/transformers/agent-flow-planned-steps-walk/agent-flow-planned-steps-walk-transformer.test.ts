import {
  OperationItemStub,
  QuestStub,
  RoutedGraphNodeKeyStub,
} from '@dungeonmaster/shared/contracts';

import { agentFlowFamilyResolveTransformer } from '../agent-flow-family-resolve/agent-flow-family-resolve-transformer';
import { agentFlowPlannedStepsWalkTransformer } from './agent-flow-planned-steps-walk-transformer';

const CODEWEAVER_GRAPH = agentFlowFamilyResolveTransformer({
  quest: QuestStub(),
  operationItem: OperationItemStub({ role: 'codeweaver' }),
});

describe('agentFlowPlannedStepsWalkTransformer', () => {
  describe('walking a real codeweaver graph', () => {
    it("VALID: {cursor: 'review'} => walks the done chain to the family's own close-out", () => {
      const result = agentFlowPlannedStepsWalkTransformer({
        graph: CODEWEAVER_GRAPH,
        cursor: RoutedGraphNodeKeyStub({ value: 'review' }),
      });

      expect(result).toStrictEqual(['review', 'commit', 'ward']);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {cursor: undefined} => returns an empty walk', () => {
      expect(
        agentFlowPlannedStepsWalkTransformer({ graph: CODEWEAVER_GRAPH, cursor: undefined }),
      ).toStrictEqual([]);
    });

    it('EDGE: {cursor names a step the graph does not declare} => returns an empty walk rather than throwing', () => {
      expect(
        agentFlowPlannedStepsWalkTransformer({
          graph: CODEWEAVER_GRAPH,
          cursor: RoutedGraphNodeKeyStub({ value: 'retired-step' }),
        }),
      ).toStrictEqual([]);
    });
  });
});
