import { callChainLinesRenderLayerBroker } from './call-chain-lines-render-layer-broker';
import { callChainLinesRenderLayerBrokerProxy } from './call-chain-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('callChainLinesRenderLayerBroker', () => {
  describe('terminal adapter import', () => {
    it('VALID: {responder importing one adapter} => emits one → adapter line', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'quest-start-responder.ts': ContentTextStub({
            value: `import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '      → adapters/hono/serve' })]);
    });
  });

  describe('broker chain into adapter', () => {
    it('VALID: {responder → broker → adapter} => emits two → lines, indented for depth', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src',
      });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/startup/start-orchestrator.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'chat-start-responder.ts': ContentTextStub({
            value: `import { chatStartBroker } from '../../../brokers/chat/start/chat-start-broker';`,
          }),
          'chat-start-broker.ts': ContentTextStub({
            value: `import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → brokers/chat/start' }),
        ContentTextStub({ value: '        → adapters/fs/write-file' }),
      ]);
    });
  });

  describe('cycle guard', () => {
    it('VALID: {broker A imports broker B which imports broker A} => stops at second visit', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/responders/cycle/foo/cycle-foo-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src',
      });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/orchestrator/src/startup/start-orchestrator.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'cycle-foo-responder.ts': ContentTextStub({
            value: `import { cycleABroker } from '../../../brokers/cycle/a/cycle-a-broker';`,
          }),
          'cycle-a-broker.ts': ContentTextStub({
            value: `import { cycleBBroker } from '../../../brokers/cycle/b/cycle-b-broker';`,
          }),
          'cycle-b-broker.ts': ContentTextStub({
            value: `import { cycleABroker } from '../../../brokers/cycle/a/cycle-a-broker';`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → brokers/cycle/a' }),
        ContentTextStub({ value: '        → brokers/cycle/b' }),
      ]);
    });
  });

  describe('empty chain', () => {
    it('EMPTY: {responder with no eligible imports} => returns empty array', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/foo/foo-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupMissing();

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
