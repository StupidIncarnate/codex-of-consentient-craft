import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { architectureWsEdgesBrokerProxy } from '../ws-edges/architecture-ws-edges-broker.proxy';
import { architectureFileBusEdgesBrokerProxy } from '../file-bus-edges/architecture-file-bus-edges-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const SERVER_STATICS = ContentTextStub({
  value: `export const apiRoutesStatics = {
  quests: { list: '/api/quests', start: '/api/quests/:questId/start' },
  health: { check: '/api/health' },
} as const;`,
});

const WEB_STATICS_PAIRED = ContentTextStub({
  value: `export const webConfigStatics = {
  api: { routes: { list: '/api/quests', start: '/api/quests/:questId/start' } },
} as const;`,
});

const WEB_STATICS_EMPTY = ContentTextStub({
  value: `export const webConfigStatics = {
  api: { routes: {} },
} as const;`,
});

export const edgesFooterRenderLayerBrokerProxy = (): {
  setupWithPairedEdges: () => void;
  setupWithOrphanEdges: () => void;
  setupEmpty: () => void;
} => {
  const edgeGraphProxy = architectureEdgeGraphBrokerProxy();
  // ws/file-bus broker proxies are initialized so registerMock wires them up, but we don't
  // call .setup() — that would overwrite the underlying readdir/readFile adapter
  // implementations the edge-graph proxy installs. The HTTP-fixture data has no WS/file-bus
  // calls, so both brokers naturally return empty edge sets.
  architectureWsEdgesBrokerProxy();
  architectureFileBusEdgesBrokerProxy();

  const flowPath = AbsoluteFilePathStub({
    value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
  });
  const webBrokerPath = AbsoluteFilePathStub({
    value: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
  });

  return {
    setupWithPairedEdges: (): void => {
      edgeGraphProxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS_PAIRED,
        flowFiles: [
          {
            path: flowPath,
            source: ContentTextStub({
              value: `app.get(apiRoutesStatics.quests.list, async (c) => {});
app.post(apiRoutesStatics.quests.start, async (c) => {});`,
            }),
          },
        ],
        brokerFiles: [
          {
            path: webBrokerPath,
            source: ContentTextStub({
              value: `fetchPostAdapter({ url: webConfigStatics.api.routes.start });
fetchGetAdapter({ url: webConfigStatics.api.routes.list });`,
            }),
          },
        ],
      });
    },

    setupWithOrphanEdges: (): void => {
      edgeGraphProxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS_EMPTY,
        flowFiles: [
          {
            path: flowPath,
            source: ContentTextStub({
              value: `app.get(apiRoutesStatics.quests.list, async (c) => {});
app.get(apiRoutesStatics.health.check, async (c) => {});`,
            }),
          },
        ],
        brokerFiles: [],
      });
    },

    setupEmpty: (): void => {
      edgeGraphProxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS_EMPTY,
        flowFiles: [],
        brokerFiles: [],
      });
    },
  };
};
