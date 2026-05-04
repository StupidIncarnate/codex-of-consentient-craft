import { wsServerAdaptersFindLayerBroker } from './ws-server-adapters-find-layer-broker';
import { wsServerAdaptersFindLayerBrokerProxy } from './ws-server-adapters-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const HONO_WS_ADAPTER = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.ts',
});
const HTTP_ADAPTER = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/adapters/hono/serve/hono-serve-adapter.ts',
});

describe('wsServerAdaptersFindLayerBroker', () => {
  describe('no adapter files', () => {
    it('EMPTY: {no source files} => returns empty array', () => {
      const proxy = wsServerAdaptersFindLayerBrokerProxy();
      proxy.setup({ sourceFiles: [] });

      const result = wsServerAdaptersFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('adapter imports a known WS-server npm package', () => {
    it('VALID: {adapter imports @hono/node-ws} => returns adapter path', () => {
      const proxy = wsServerAdaptersFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: HONO_WS_ADAPTER,
            source: ContentTextStub({
              value: "import { createNodeWebSocket } from '@hono/node-ws';",
            }),
          },
        ],
      });

      const result = wsServerAdaptersFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([HONO_WS_ADAPTER]);
    });
  });

  describe('adapter imports an unrelated npm package', () => {
    it('EMPTY: {adapter imports hono only, no ws} => excluded', () => {
      const proxy = wsServerAdaptersFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: HTTP_ADAPTER,
            source: ContentTextStub({
              value: "import { serve } from '@hono/node-server';",
            }),
          },
        ],
      });

      const result = wsServerAdaptersFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('non-adapter file imports a known WS package', () => {
    it('EMPTY: {file outside adapters/ folder} => excluded', () => {
      const proxy = wsServerAdaptersFindLayerBrokerProxy();
      proxy.setup({
        sourceFiles: [
          {
            path: AbsoluteFilePathStub({
              value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
            }),
            source: ContentTextStub({
              value: "import { foo } from '@hono/node-ws';",
            }),
          },
        ],
      });

      const result = wsServerAdaptersFindLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
