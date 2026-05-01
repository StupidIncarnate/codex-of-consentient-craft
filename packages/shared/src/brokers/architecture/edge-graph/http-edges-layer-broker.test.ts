import { httpEdgesLayerBroker } from './http-edges-layer-broker';
import { httpEdgesLayerBrokerProxy } from './http-edges-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const SERVER_STATICS = ContentTextStub({
  value: `export const apiRoutesStatics = {
  health: { check: '/api/health' },
  quests: {
    list: '/api/quests',
    start: '/api/quests/:questId/start',
    byId: '/api/quests/:questId',
    delete: '/api/quests/:questId',
  },
  guilds: { list: '/api/guilds' },
} as const;`,
});

const WEB_STATICS = ContentTextStub({
  value: `export const webConfigStatics = {
  api: {
    routes: {
      quests: '/api/quests',
      questStart: '/api/quests/:questId/start',
      questById: '/api/quests/:questId',
      guilds: '/api/guilds',
      sessionChatHistory: '/api/sessions/:sessionId/chat/history',
    },
  },
} as const;`,
});

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});
const HEALTH_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/health/health-flow.ts',
});
const QUEST_LIST_BROKER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
});
const QUEST_START_BROKER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
});

describe('httpEdgesLayerBroker', () => {
  describe('statics reference resolution', () => {
    it('VALID: {apiRoutesStatics.quests.start} => resolves to /api/quests/:questId/start', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.post(apiRoutesStatics.quests.start, async (c) => {});',
            }),
          },
        ],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'POST',
          urlPattern: '/api/quests/:questId/start',
          serverFlowFile: QUEST_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        },
      ]);
    });
  });

  describe('inline string literal routes', () => {
    it('VALID: {app.get with inline string literal} => produces edge with literal urlPattern', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: HEALTH_FLOW_PATH,
            source: ContentTextStub({
              value: "app.get('/api/health', (c) => c.json({ status: 'ok' }));",
            }),
          },
        ],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          urlPattern: '/api/health',
          serverFlowFile: HEALTH_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        },
      ]);
    });
  });

  describe('pairing', () => {
    it('VALID: {matching server route + web fetch call} => produces paired=true edge', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
            }),
          },
        ],
        brokerFiles: [
          {
            path: QUEST_LIST_BROKER_PATH,
            source: ContentTextStub({
              value: 'fetchGetAdapter({ url: webConfigStatics.api.routes.quests });',
            }),
          },
        ],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          urlPattern: '/api/quests',
          serverFlowFile: QUEST_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: QUEST_LIST_BROKER_PATH,
          paired: true,
        },
      ]);
    });

    it('VALID: {server route without matching web call} => orphan-server edge with paired=false', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: HEALTH_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.get(apiRoutesStatics.health.check, (c) => {});',
            }),
          },
        ],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          urlPattern: '/api/health',
          serverFlowFile: HEALTH_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        },
      ]);
    });

    it('VALID: {web fetch call without matching server route} => orphan-web edge with null serverFlowFile', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        brokerFiles: [
          {
            path: QUEST_LIST_BROKER_PATH,
            source: ContentTextStub({
              value: 'fetchGetAdapter({ url: webConfigStatics.api.routes.sessionChatHistory });',
            }),
          },
        ],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          urlPattern: '/api/sessions/:sessionId/chat/history',
          serverFlowFile: null,
          serverResponderFile: null,
          webBrokerFile: QUEST_LIST_BROKER_PATH,
          paired: false,
        },
      ]);
    });
  });

  describe('method detection', () => {
    it('VALID: {app.post route} => method is POST', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.post(apiRoutesStatics.quests.start, async (c) => {});',
            }),
          },
        ],
        brokerFiles: [
          {
            path: QUEST_START_BROKER_PATH,
            source: ContentTextStub({
              value:
                "fetchPostAdapter({ url: webConfigStatics.api.routes.questStart.replace(':questId', questId), body: {} });",
            }),
          },
        ],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'POST',
          urlPattern: '/api/quests/:questId/start',
          serverFlowFile: QUEST_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: QUEST_START_BROKER_PATH,
          paired: true,
        },
      ]);
    });

    it('VALID: {app.patch route} => method is PATCH', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.patch(apiRoutesStatics.quests.byId, async (c) => {});',
            }),
          },
        ],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'PATCH',
          urlPattern: '/api/quests/:questId',
          serverFlowFile: QUEST_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        },
      ]);
    });

    it('VALID: {app.delete route} => method is DELETE', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: 'app.delete(apiRoutesStatics.quests.delete, async (c) => {});',
            }),
          },
        ],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'DELETE',
          urlPattern: '/api/quests/:questId',
          serverFlowFile: QUEST_FLOW_PATH,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        },
      ]);
    });
  });

  describe('test file filtering', () => {
    it('VALID: {integration test file as flow} => filtered out, produces no edges', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: AbsoluteFilePathStub({
              value: '/repo/packages/server/src/flows/quest/quest-flow.integration.test.ts',
            }),
            source: ContentTextStub({
              value: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
            }),
          },
        ],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {proxy file as broker} => filtered out, produces no edges', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        brokerFiles: [
          {
            path: AbsoluteFilePathStub({
              value: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.proxy.ts',
            }),
            source: ContentTextStub({
              value: 'fetchGetAdapter({ url: webConfigStatics.api.routes.quests });',
            }),
          },
        ],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty package', () => {
    it('EMPTY: {no flow files and no broker files} => returns empty array', () => {
      const proxy = httpEdgesLayerBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        brokerFiles: [],
      });

      const result = httpEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
