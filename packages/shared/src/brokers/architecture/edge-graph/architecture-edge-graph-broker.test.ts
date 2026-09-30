import { architectureEdgeGraphBroker } from './architecture-edge-graph-broker';
import { architectureEdgeGraphBrokerProxy } from './architecture-edge-graph-broker.proxy';

const PROJECT_ROOT = '/repo';

const SERVER_STATICS = `export const apiRoutesStatics = {
  quests: { list: '/api/quests' },
} as const;`;

const WEB_STATICS = `export const webConfigStatics = {
  api: { routes: { quests: '/api/quests' } },
} as const;`;

describe('architectureEdgeGraphBroker', () => {
  describe('no source files', () => {
    it('EMPTY: {no flow or broker files} => returns empty array', () => {
      const proxy = architectureEdgeGraphBrokerProxy();

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        brokerFiles: [],
      });

      const result = architectureEdgeGraphBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('server flow file with route registration', () => {
    it('VALID: {flow with GET /api/quests} => returns one HTTP edge with correct method and urlPattern', () => {
      const proxy = architectureEdgeGraphBrokerProxy();
      const flowPath = '/repo/packages/server/src/flows/quest/quest-flow.ts';

      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: flowPath,
            source: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
          },
        ],
        brokerFiles: [],
      });

      const result = architectureEdgeGraphBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          urlPattern: '/api/quests',
          serverFlowFile: flowPath,
          serverResponderFile: null,
          webBrokerFile: null,
          paired: false,
        },
      ]);
    });
  });
});
