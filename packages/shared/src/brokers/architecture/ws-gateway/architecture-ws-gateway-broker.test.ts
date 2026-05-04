import { architectureWsGatewayBroker } from './architecture-ws-gateway-broker';
import { architectureWsGatewayBrokerProxy } from './architecture-ws-gateway-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const WS_ADAPTER = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts',
});
const GATEWAY_FILE = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
});

describe('architectureWsGatewayBroker', () => {
  describe('no relevant files', () => {
    it('EMPTY: {no source files} => returns empty array', () => {
      const proxy = architectureWsGatewayBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('end-to-end discovery', () => {
    it('VALID: {WS adapter + gateway responder present} => returns gateway path', () => {
      const proxy = architectureWsGatewayBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: WS_ADAPTER,
            source: ContentTextStub({
              value: "import { createNodeWebSocket } from '@hono/node-ws';",
            }),
          },
          {
            path: GATEWAY_FILE,
            source: ContentTextStub({
              value:
                "import { honoCreateNodeWebSocketAdapter } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';",
            }),
          },
        ],
      });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([GATEWAY_FILE]);
    });
  });

  describe('no WS adapter', () => {
    it('EMPTY: {no adapter imports a known WS package} => no gateways', () => {
      const proxy = architectureWsGatewayBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({
              value: '/repo/packages/server/src/adapters/hono/serve/hono-serve-adapter.ts',
            }),
            source: ContentTextStub({
              value: "import { serve } from '@hono/node-server';",
            }),
          },
          {
            path: GATEWAY_FILE,
            source: ContentTextStub({
              value:
                "import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';",
            }),
          },
        ],
      });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
