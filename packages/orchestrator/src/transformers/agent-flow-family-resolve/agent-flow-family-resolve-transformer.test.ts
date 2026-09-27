import {
  OperationItemStub,
  QuestStub,
  RoutedGraphNodeKeyStub,
  RoutedGraphOutcomeWordStub,
} from '@dungeonmaster/shared/contracts';

import { agentFlowFamilyResolveTransformer } from './agent-flow-family-resolve-transformer';

describe('agentFlowFamilyResolveTransformer', () => {
  describe('a role that names a real family', () => {
    it("VALID: {role: 'codeweaver'} => resolves the codeweaver step graph", () => {
      const graph = agentFlowFamilyResolveTransformer({
        quest: QuestStub(),
        operationItem: OperationItemStub({ role: 'codeweaver' }),
      });

      expect({ graphName: graph.graphName, entry: graph.entry }).toStrictEqual({
        graphName: 'codeweaver',
        entry: 'plan',
      });
    });

    it("VALID: {role: 'ward'} => resolves the wardFull step graph, keyed by family not role", () => {
      const graph = agentFlowFamilyResolveTransformer({
        quest: QuestStub(),
        operationItem: OperationItemStub({ role: 'ward' }),
      });

      expect({ graphName: graph.graphName, entry: graph.entry }).toStrictEqual({
        graphName: 'wardFull',
        entry: 'gate',
      });
    });

    it("VALID: {role: 'siegemaster'} => resolves a graph whose ward step overrides CLOSE_OUT's own done route", () => {
      const graph = agentFlowFamilyResolveTransformer({
        quest: QuestStub(),
        operationItem: OperationItemStub({ role: 'siegemaster' }),
      });

      const wardNode = graph.nodes[RoutedGraphNodeKeyStub({ value: 'ward' })];

      expect(wardNode?.routes[RoutedGraphOutcomeWordStub({ value: 'done' })]).toBe('sweepOut');
    });
  });

  describe('a role no family carries', () => {
    it("ERROR: {role: 'spiritmender'} => throws, naming the quest type and the role", () => {
      expect(() =>
        agentFlowFamilyResolveTransformer({
          quest: QuestStub(),
          operationItem: OperationItemStub({ role: 'spiritmender' }),
        }),
      ).toThrow(/no family in questFlowStatics\.feature\.families carries role 'spiritmender'/u);
    });
  });
});
