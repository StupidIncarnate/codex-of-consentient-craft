import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';

describe('importsInFolderTypeFindLayerBroker', () => {
  describe('flow imports', () => {
    it('VALID: {startup file with flow imports} => returns flow file paths in entries', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const packageSrcPath = '/repo/packages/server/src';

      proxy.setupSource({
        sourceFile,
        content: `import { questFlow } from '../flows/quest/quest-flow';`,
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual({
        entries: [
          '/repo/packages/server/src/flows/quest/quest-flow.ts',
        ],
        layers: [],
      });
    });

    it('VALID: {startup file with multiple flow imports} => returns all flow paths in entries', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const packageSrcPath = '/repo/packages/server/src';

      proxy.setupSource({
        sourceFile,
        content: [
            `import { questFlow } from '../flows/quest/quest-flow';`,
            `import { guildFlow } from '../flows/guild/guild-flow';`,
          ].join('\n'),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual({
        entries: [
          '/repo/packages/server/src/flows/quest/quest-flow.ts',
          '/repo/packages/server/src/flows/guild/guild-flow.ts',
        ],
        layers: [],
      });
    });
  });

  describe('filtering', () => {
    it('VALID: {non-flow imports present} => returns only flow paths in entries', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const packageSrcPath = '/repo/packages/server/src';

      proxy.setupSource({
        sourceFile,
        content: [
            `import { questFlow } from '../flows/quest/quest-flow';`,
            `import { someContract } from '@dungeonmaster/shared/contracts';`,
          ].join('\n'),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual({
        entries: [
          '/repo/packages/server/src/flows/quest/quest-flow.ts',
        ],
        layers: [],
      });
    });

    it('VALID: {test file import in flows/} => filters out test file from both buckets', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const packageSrcPath = '/repo/packages/server/src';

      proxy.setupSource({
        sourceFile,
        content: `import { questFlow } from '../flows/quest/quest-flow.test';`,
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual({ entries: [], layers: [] });
    });
  });

  describe('layer file partitioning', () => {
    it('VALID: {parent broker importing a layer broker} => returns the layer file in layers, not entries', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/orch/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts';
      const packageSrcPath = '/repo/packages/orch/src';

      proxy.setupSource({
        sourceFile,
        content: `import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';`,
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'brokers',
      });

      expect(result).toStrictEqual({
        entries: [],
        layers: [
          '/repo/packages/orch/src/brokers/quest/orchestration-loop/run-siegemaster-layer-broker.ts',
        ],
      });
    });

    it('VALID: {parent broker importing both entry sibling and layer sibling} => partitions into entries and layers', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/orch/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts';
      const packageSrcPath = '/repo/packages/orch/src';

      proxy.setupSource({
        sourceFile,
        content: [
            `import { questGetBroker } from '../get/quest-get-broker';`,
            `import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';`,
          ].join('\n'),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'brokers',
      });

      expect(result).toStrictEqual({
        entries: [
          '/repo/packages/orch/src/brokers/quest/get/quest-get-broker.ts',
        ],
        layers: [
          '/repo/packages/orch/src/brokers/quest/orchestration-loop/run-siegemaster-layer-broker.ts',
        ],
      });
    });
  });

  describe('missing source file', () => {
    it('EMPTY: {source file missing} => returns empty entries and empty layers', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = '/repo/packages/server/src/startup/start-missing.ts';
      const packageSrcPath = '/repo/packages/server/src';

      proxy.setupMissing({ sourceFile });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual({ entries: [], layers: [] });
    });
  });
});
