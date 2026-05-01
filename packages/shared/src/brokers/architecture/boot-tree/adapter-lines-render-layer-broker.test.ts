import { adapterLinesRenderLayerBroker } from './adapter-lines-render-layer-broker';
import { adapterLinesRenderLayerBrokerProxy } from './adapter-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('adapterLinesRenderLayerBroker', () => {
  describe('regular adapter', () => {
    it('VALID: {responder with regular adapter} => renders → line with qualified name', () => {
      const proxy = adapterLinesRenderLayerBrokerProxy();
      const responderFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';`,
        }),
      });

      const result = adapterLinesRenderLayerBroker({
        responderFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '      → adapters/hono/serve' })]);
    });
  });

  describe('WS subscriber adapter', () => {
    it('VALID: {EventsOn adapter} => renders side-channel note line', () => {
      const proxy = adapterLinesRenderLayerBrokerProxy();
      const responderFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';`,
        }),
      });

      const result = adapterLinesRenderLayerBroker({
        responderFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({
          value:
            '      + adapters/orchestrator/events-on/orchestrator-events-on-adapter    ← runtime FLOW shown in Side-channel',
        }),
      ]);
    });
  });

  describe('empty adapters', () => {
    it('EMPTY: {responder with no adapters} => returns empty array', () => {
      const proxy = adapterLinesRenderLayerBrokerProxy();
      const responderFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupMissing();

      const result = adapterLinesRenderLayerBroker({
        responderFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
