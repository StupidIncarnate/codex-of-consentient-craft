import { callChainLinesRenderLayerBroker } from './call-chain-lines-render-layer-broker';
import { callChainLinesRenderLayerBrokerProxy } from './call-chain-lines-render-layer-broker.proxy';

describe('callChainLinesRenderLayerBroker', () => {
  describe('leaf broker import', () => {
    it('VALID: {responder importing one broker that imports nothing} => emits one → broker line', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile =
        '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts';
      const packageSrcPath = '/repo/packages/server/src';
      const renderingFilePath = '/repo/packages/server/src/startup/start-server.ts';

      proxy.setupFileContentsMap({
        map: {
          'quest-start-responder.ts': `import { questStartBroker } from '../../../brokers/quest/start/quest-start-broker';`,
          'quest-start-broker.ts': `export const questStartBroker = () => {};`,
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['      → questStartBroker']);
    });
  });

  describe('broker chain into broker', () => {
    it('VALID: {responder → broker → broker} => emits two → lines, indented for depth', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile =
        '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts';
      const packageSrcPath = '/repo/packages/orchestrator/src';
      const renderingFilePath = '/repo/packages/orchestrator/src/startup/start-orchestrator.ts';

      proxy.setupFileContentsMap({
        map: {
          'chat-start-responder.ts': `import { chatStartBroker } from '../../../brokers/chat/start/chat-start-broker';`,
          'chat-start-broker.ts': [
            `import { chatPersistBroker } from '../persist/chat-persist-broker';`,
            `export const chatStartBroker = () => {};`,
          ].join('\n'),
          'chat-persist-broker.ts': `export const chatPersistBroker = () => {};`,
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['      → chatStartBroker', '        → chatPersistBroker']);
    });
  });

  describe('cycle guard', () => {
    it('VALID: {broker A imports broker B which imports broker A} => stops at second visit', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile =
        '/repo/packages/orchestrator/src/responders/cycle/foo/cycle-foo-responder.ts';
      const packageSrcPath = '/repo/packages/orchestrator/src';
      const renderingFilePath = '/repo/packages/orchestrator/src/startup/start-orchestrator.ts';

      proxy.setupFileContentsMap({
        map: {
          'cycle-foo-responder.ts': `import { cycleABroker } from '../../../brokers/cycle/a/cycle-a-broker';`,
          'cycle-a-broker.ts': [
            `import { cycleBBroker } from '../../../brokers/cycle/b/cycle-b-broker';`,
            `export const cycleABroker = () => {};`,
          ].join('\n'),
          'cycle-b-broker.ts': [
            `import { cycleABroker } from '../../../brokers/cycle/a/cycle-a-broker';`,
            `export const cycleBBroker = () => {};`,
          ].join('\n'),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['      → cycleABroker', '        → cycleBBroker']);
    });
  });

  describe('empty chain', () => {
    it('EMPTY: {responder with no eligible imports} => returns empty array', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = '/repo/packages/server/src/responders/foo/foo-responder.ts';
      const packageSrcPath = '/repo/packages/server/src';
      const renderingFilePath = '/repo/packages/server/src/startup/start-server.ts';

      proxy.setupMissing({ sourceFile });

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
      const sourceFile =
        '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts';
      const packageSrcPath = '/repo/packages/server/src';
      const renderingFilePath = '/repo/packages/server/src/startup/start-server.ts';

      proxy.setupFileContentsMap({
        map: {
          'quest-start-responder.ts': `import { questStartBroker } from '../../../brokers/quest/start/quest-start-broker';`,
          'quest-start-broker.ts': `// no export declaration here`,
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['      → quest-start-broker']);
    });
  });

  describe('layer file rendering', () => {
    it('VALID: {parent broker importing a layer broker that calls another broker} => renders layer at depth 1, broker at depth 2', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = '/repo/packages/orch/src/responders/quest/start/quest-start-responder.ts';
      const packageSrcPath = '/repo/packages/orch/src';
      const renderingFilePath = '/repo/packages/orch/src/startup/start-orchestrator.ts';

      proxy.setupFileContentsMap({
        map: {
          'quest-start-responder.ts': `import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';`,
          'quest-orchestration-loop-broker.ts': [
            `import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';`,
            `export const questOrchestrationLoopBroker = () => {};`,
          ].join('\n'),
          'run-siegemaster-layer-broker.ts': [
            `import { siegeRunBroker } from '../../siege/run/siege-run-broker';`,
            `export const runSiegemasterLayerBroker = () => {};`,
          ].join('\n'),
          'siege-run-broker.ts': `export const siegeRunBroker = () => {};`,
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        '      → questOrchestrationLoopBroker',
        '        → runSiegemasterLayerBroker',
        '          → siegeRunBroker',
      ]);
    });

    it('VALID: {layer broker reachable from both parent and another layer} => renders once thanks to shared visited set', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = '/repo/packages/orch/src/responders/foo/x/foo-responder.ts';
      const packageSrcPath = '/repo/packages/orch/src';
      const renderingFilePath = '/repo/packages/orch/src/startup/start-orchestrator.ts';

      proxy.setupFileContentsMap({
        map: {
          'foo-responder.ts': `import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';`,
          'quest-orchestration-loop-broker.ts': [
            `import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';`,
            `import { runWardLayerBroker } from './run-ward-layer-broker';`,
            `export const questOrchestrationLoopBroker = () => {};`,
          ].join('\n'),
          'run-siegemaster-layer-broker.ts': [
            `import { runWardLayerBroker } from './run-ward-layer-broker';`,
            `export const runSiegemasterLayerBroker = () => {};`,
          ].join('\n'),
          'run-ward-layer-broker.ts': `export const runWardLayerBroker = () => {};`,
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        '      → questOrchestrationLoopBroker',
        '        → runSiegemasterLayerBroker',
        '          → runWardLayerBroker',
      ]);
    });

    it('VALID: {layer file imports parent} => cycle does not infinite-loop', () => {
      const proxy = callChainLinesRenderLayerBrokerProxy();
      const sourceFile = '/repo/packages/orch/src/responders/foo/x/foo-responder.ts';
      const packageSrcPath = '/repo/packages/orch/src';
      const renderingFilePath = '/repo/packages/orch/src/startup/start-orchestrator.ts';

      proxy.setupFileContentsMap({
        map: {
          'foo-responder.ts': `import { parentBroker } from '../../../brokers/parent/x/parent-broker';`,
          'parent-broker.ts': [
            `import { fooXLayerBroker } from './foo-x-layer-broker';`,
            `export const parentBroker = () => {};`,
          ].join('\n'),
          'foo-x-layer-broker.ts': [
            `import { parentBroker } from './parent-broker';`,
            `export const fooXLayerBroker = () => {};`,
          ].join('\n'),
        },
      });

      const result = callChainLinesRenderLayerBroker({
        sourceFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['      → parentBroker', '        → fooXLayerBroker']);
    });
  });
});
