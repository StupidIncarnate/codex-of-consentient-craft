import { architectureWsGatewayBroker } from './architecture-ws-gateway-broker';
import { architectureWsGatewayBrokerProxy } from './architecture-ws-gateway-broker.proxy';

const PROJECT_ROOT = '/repo';
const WS_ADAPTER =
  '/repo/packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts';
const GATEWAY_FILE = '/repo/packages/server/src/responders/server/init/server-init-responder.ts';

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
            source: "import { createNodeWebSocket } from '@hono/node-ws';",
          },
          {
            path: GATEWAY_FILE,
            source:
              "import { honoCreateNodeWebSocketAdapter } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';",
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
            path: '/repo/packages/server/src/adapters/hono/serve/hono-serve-adapter.ts',
            source: "import { serve } from '@hono/node-server';",
          },
          {
            path: GATEWAY_FILE,
            source:
              "import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';",
          },
        ],
      });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('direct WS package / gateway import (post-adapters)', () => {
    it('VALID: {file directly imports #gateway/npm/hono__node-ws} => returns gateway path', () => {
      const proxy = architectureWsGatewayBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: GATEWAY_FILE,
            source: "import { createNodeWebSocket } from '#gateway/npm/hono__node-ws';",
          },
        ],
      });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([GATEWAY_FILE]);
    });

    it('VALID: {file directly imports @hono/node-ws} => returns gateway path', () => {
      const proxy = architectureWsGatewayBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: GATEWAY_FILE,
            source: "import { createNodeWebSocket } from '@hono/node-ws';",
          },
        ],
      });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([GATEWAY_FILE]);
    });

    it('EMPTY: {file inside packages/@gateway/ imports @hono/node-ws} => excluded (it is the wrapper)', () => {
      const proxy = architectureWsGatewayBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: '/repo/packages/@gateway/npm/src/hono__node-ws/hono__node-ws.ts',
            source: "export * from '@hono/node-ws';",
          },
        ],
      });

      const result = architectureWsGatewayBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
