import { routeEntryLinesRenderLayerBroker } from './route-entry-lines-render-layer-broker';
import { routeEntryLinesRenderLayerBrokerProxy } from './route-entry-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/responders/quest/list/quest-list-responder.ts',
});

const RESPONDER_SOURCE_WITH_ADAPTER = ContentTextStub({
  value: `import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
export const QuestListResponder = async () => {};`,
});

describe('routeEntryLinesRenderLayerBroker', () => {
  describe('edge with null serverResponderFile', () => {
    it('EDGE: {serverResponderFile: null} => returns only the method-url line', () => {
      routeEntryLinesRenderLayerBrokerProxy();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/health' }),
        serverFlowFile: null,
        serverResponderFile: null,
        paired: false,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['GET    /api/health']);
    });
  });

  describe('edge with responder file but missing source', () => {
    it('EMPTY: {responder source missing} => returns method-url and responder folder', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      proxy.setupMissing();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverResponderFile: RESPONDER_PATH,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['GET    /api/quests', '  → responders/quest/list']);
    });
  });

  describe('edge with responder source and single adapter, no adapter source', () => {
    it('VALID: {responder with one adapter import, no adapter source} => returns method-url, responder, and adapter folder', () => {
      const proxy = routeEntryLinesRenderLayerBrokerProxy();
      // First read: responder source
      proxy.setupReturns({ content: RESPONDER_SOURCE_WITH_ADAPTER });
      // Second read: adapter source is missing
      proxy.setupMissing();

      const edge = HttpEdgeStub({
        method: ContentTextStub({ value: 'GET' }),
        urlPattern: ContentTextStub({ value: '/api/quests' }),
        serverResponderFile: RESPONDER_PATH,
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
        serverResponderFile: null,
      });

      const result = routeEntryLinesRenderLayerBroker({ edge, packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['POST   /api/quests/:questId/start']);
    });
  });
});
