import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';
import { responderLinesRenderLayerBrokerProxy } from './responder-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('responderLinesRenderLayerBroker', () => {
  describe('single responder no adapters', () => {
    it('VALID: {flow with one responder and no adapters} => returns ↳ responder line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupFlowSource({
        content: ContentTextStub({
          value: `import { questStartResponder } from '../../responders/quest/start/quest-start-responder';`,
        }),
      });
      proxy.setupAdapterMissing();

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '  ↳ quest-start-responder' })]);
    });
  });

  describe('responder with adapter', () => {
    it('VALID: {flow with responder and adapter} => renders ↳ line and → adapter line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/server/server-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupFlowSource({
        content: ContentTextStub({
          value: `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
        }),
      });
      proxy.setupAdapterSource({
        content: ContentTextStub({
          value: `import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';`,
        }),
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '  ↳ server-init-responder' }),
        ContentTextStub({ value: '      → adapters/hono/serve' }),
      ]);
    });
  });

  describe('empty flow', () => {
    it('EMPTY: {flow with no responder imports} => returns empty array', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/health/health-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupFlowMissing();
      proxy.setupAdapterMissing();

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
