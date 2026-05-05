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
          'hono-serve-adapter.ts': ContentTextStub({
            value: `export const honoServeAdapter = () => {};`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '      → honoServeAdapter' })]);
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
            value: [
              `import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';`,
              `export const chatStartBroker = () => {};`,
            ].join('\n'),
          }),
          'fs-write-file-adapter.ts': ContentTextStub({
            value: `export const fsWriteFileAdapter = () => {};`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → chatStartBroker' }),
        ContentTextStub({ value: '        → fsWriteFileAdapter' }),
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
            value: [
              `import { cycleBBroker } from '../../../brokers/cycle/b/cycle-b-broker';`,
              `export const cycleABroker = () => {};`,
            ].join('\n'),
          }),
          'cycle-b-broker.ts': ContentTextStub({
            value: [
              `import { cycleABroker } from '../../../brokers/cycle/a/cycle-a-broker';`,
              `export const cycleBBroker = () => {};`,
            ].join('\n'),
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → cycleABroker' }),
        ContentTextStub({ value: '        → cycleBBroker' }),
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

  describe('export-name fallback', () => {
    it('VALID: {imported file has no extractable export} => falls back to kebab basename', () => {
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
          'hono-serve-adapter.ts': ContentTextStub({
            value: `// no export declaration here`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '      → hono-serve-adapter' })]);
    });
  });

  describe('layer file rendering', () => {
    it('VALID: {parent broker importing a layer broker that calls an adapter} => renders layer at depth 0, adapter at depth 1', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/orch/src/responders/quest/start/quest-start-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/orch/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/orch/src/startup/start-orchestrator.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'quest-start-responder.ts': ContentTextStub({
            value: `import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';`,
          }),
          'quest-orchestration-loop-broker.ts': ContentTextStub({
            value: [
              `import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';`,
              `export const questOrchestrationLoopBroker = () => {};`,
            ].join('\n'),
          }),
          'run-siegemaster-layer-broker.ts': ContentTextStub({
            value: [
              `import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';`,
              `export const runSiegemasterLayerBroker = () => {};`,
            ].join('\n'),
          }),
          'child-process-spawn-adapter.ts': ContentTextStub({
            value: `export const childProcessSpawnAdapter = () => {};`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → questOrchestrationLoopBroker' }),
        ContentTextStub({ value: '        → runSiegemasterLayerBroker' }),
        ContentTextStub({ value: '          → childProcessSpawnAdapter' }),
      ]);
    });

    it('VALID: {layer broker reachable from both parent and another layer} => renders once thanks to shared visited set', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/orch/src/responders/foo/x/foo-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/orch/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/orch/src/startup/start-orchestrator.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'foo-responder.ts': ContentTextStub({
            value: `import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';`,
          }),
          'quest-orchestration-loop-broker.ts': ContentTextStub({
            value: [
              `import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';`,
              `import { runWardLayerBroker } from './run-ward-layer-broker';`,
              `export const questOrchestrationLoopBroker = () => {};`,
            ].join('\n'),
          }),
          'run-siegemaster-layer-broker.ts': ContentTextStub({
            value: [
              `import { runWardLayerBroker } from './run-ward-layer-broker';`,
              `export const runSiegemasterLayerBroker = () => {};`,
            ].join('\n'),
          }),
          'run-ward-layer-broker.ts': ContentTextStub({
            value: `export const runWardLayerBroker = () => {};`,
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → questOrchestrationLoopBroker' }),
        ContentTextStub({ value: '        → runSiegemasterLayerBroker' }),
        ContentTextStub({ value: '          → runWardLayerBroker' }),
      ]);
    });

    it('VALID: {layer file imports parent} => cycle does not infinite-loop', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/orch/src/responders/foo/x/foo-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/orch/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/orch/src/startup/start-orchestrator.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'foo-responder.ts': ContentTextStub({
            value: `import { parentBroker } from '../../../brokers/parent/x/parent-broker';`,
          }),
          'parent-broker.ts': ContentTextStub({
            value: [
              `import { fooXLayerBroker } from './foo-x-layer-broker';`,
              `export const parentBroker = () => {};`,
            ].join('\n'),
          }),
          'foo-x-layer-broker.ts': ContentTextStub({
            value: [
              `import { parentBroker } from './parent-broker';`,
              `export const fooXLayerBroker = () => {};`,
            ].join('\n'),
          }),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '      → parentBroker' }),
        ContentTextStub({ value: '        → fooXLayerBroker' }),
      ]);
    });
  });
});
