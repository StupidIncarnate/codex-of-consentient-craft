import { wsGatewayFilesFindLayerBroker } from './ws-gateway-files-find-layer-broker';
import { wsGatewayFilesFindLayerBrokerProxy } from './ws-gateway-files-find-layer-broker.proxy';

const PROJECT_ROOT = '/repo';
const WS_ADAPTER = '/repo/packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts';
const GATEWAY_FILE = '/repo/packages/server/src/responders/server/init/server-init-responder.ts';

describe('wsGatewayFilesFindLayerBroker', () => {
  describe('no adapters provided', () => {
    it('EMPTY: {empty wsServerAdapters} => returns empty array', () => {
      const proxy = wsGatewayFilesFindLayerBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = wsGatewayFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        wsServerAdapters: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('file imports a WS adapter', () => {
    it('VALID: {responder imports the WS adapter} => returns responder path', () => {
      const proxy = wsGatewayFilesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: GATEWAY_FILE,
            source: "import { honoCreateNodeWebSocketAdapter } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';",
          },
        ],
      });

      const result = wsGatewayFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        wsServerAdapters: [WS_ADAPTER],
      });

      expect(result).toStrictEqual([GATEWAY_FILE]);
    });
  });

  describe('file does not import a WS adapter', () => {
    it('EMPTY: {responder imports unrelated file} => excluded', () => {
      const proxy = wsGatewayFilesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: GATEWAY_FILE,
            source: "import { foo } from '../../../adapters/other/other-adapter';",
          },
        ],
      });

      const result = wsGatewayFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        wsServerAdapters: [WS_ADAPTER],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('adapter file is itself in sourceFiles', () => {
    it('EMPTY: {adapter file path provided as sourceFile} => excluded (adapter is not a gateway)', () => {
      const proxy = wsGatewayFilesFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WS_ADAPTER,
            source: "import { createNodeWebSocket } from '@hono/node-ws';",
          },
        ],
      });

      const result = wsGatewayFilesFindLayerBroker({
        projectRoot: PROJECT_ROOT,
        wsServerAdapters: [WS_ADAPTER],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
