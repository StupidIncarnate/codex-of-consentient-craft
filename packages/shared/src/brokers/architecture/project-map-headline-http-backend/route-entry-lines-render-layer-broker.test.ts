import { routeEntryLinesRenderLayerBroker } from './route-entry-lines-render-layer-broker';
import { routeEntryLinesRenderLayerBrokerProxy } from './route-entry-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});

const FLOW_SOURCE_WITH_LIST_RESPONDER = ContentTextStub({
  value: `import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
app.get(apiRoutesStatics.quests.list, async (c) => {});`,
});

const RESPONDER_SOURCE_WITH_ADAPTER = ContentTextStub({
  value: `import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
export const QuestListResponder = async () => {};`,
});

describe('routeEntryLinesRenderLayerBroker', () => {
  describe('edge with null serverFlowFile', () => {
    it('EDGE: {serverFlowFile: null} => returns only the method-url line', () => {
      routeEntryLinesRenderLayerBrokerProxy();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: null,
        paired: false,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['GET    /api/quests']);
    });
  });

  describe('edge with no flow source', () => {
    it('EMPTY: {flow file missing} => returns only the method-url line', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      proxy.setupMissing();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: QUEST_FLOW_PATH,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['GET    /api/quests']);
    });
  });

  describe('edge with flow source but no responder import', () => {
    it('VALID: {flow source with no responder import} => returns only the method-url line', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      proxy.setupReturns({
        content: ContentTextStub({
          value: "app.get('/api/quests', async (c) => c.json({ items: [] }));",
        }),
      });

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: QUEST_FLOW_PATH,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['GET    /api/quests']);
    });
  });

  describe('edge with flow source and single responder import, no responder source', () => {
    it('VALID: {responder import in flow, responder file missing} => returns method-url and responder folder', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      // First read: flow source (queued)
      proxy.setupReturns({ content: FLOW_SOURCE_WITH_LIST_RESPONDER });
      // Second read: responder source is missing (queued)
      proxy.setupMissing();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: QUEST_FLOW_PATH,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['GET    /api/quests', '  → responders/quest/list']);
    });
  });

  describe('edge with flow source, responder, and single adapter', () => {
    it('VALID: {responder with one adapter import, no adapter source} => returns method-url, responder, and adapter folder', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      // First read: flow source
      proxy.setupReturns({ content: FLOW_SOURCE_WITH_LIST_RESPONDER });
      // Second read: responder source
      proxy.setupReturns({ content: RESPONDER_SOURCE_WITH_ADAPTER });
      // Third read: adapter source is missing
      proxy.setupMissing();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverFlowFile: QUEST_FLOW_PATH,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual([
        'GET    /api/quests',
        '  → responders/quest/list',
        '  → adapters/orchestrator/list-quests',
      ]);
    });
  });

  describe('method padding', () => {
    it('VALID: {POST method} => method is padded to 6 characters wide', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      proxy.setupMissing();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'POST' }),
        urlPattern: ContentTextStub({ value: '/api/quests/:questId/start' }),
        serverFlowFile: QUEST_FLOW_PATH,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['POST   /api/quests/:questId/start']);
    });
  });
});
