import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('importsInFolderTypeFindLayerBroker', () => {
  describe('flow imports', () => {
    it('VALID: {startup file with flow imports} => returns flow file paths', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { questFlow } from '../flows/quest/quest-flow';`,
        }),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      ]);
    });

    it('VALID: {startup file with multiple flow imports} => returns all flow paths', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: [
            `import { questFlow } from '../flows/quest/quest-flow';`,
            `import { guildFlow } from '../flows/guild/guild-flow';`,
          ].join('\n'),
        }),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
        AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/guild/guild-flow.ts',
        }),
      ]);
    });
  });

  describe('filtering', () => {
    it('VALID: {non-flow imports present} => returns only flow paths', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: [
            `import { questFlow } from '../flows/quest/quest-flow';`,
            `import { someContract } from '@dungeonmaster/shared/contracts';`,
          ].join('\n'),
        }),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({
          value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
        }),
      ]);
    });

    it('VALID: {test file import in flows/} => filters out test file', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupSource({
        content: ContentTextStub({
          value: `import { questFlow } from '../flows/quest/quest-flow.test';`,
        }),
      });

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing source file', () => {
    it('EMPTY: {source file missing} => returns empty array', () => {
      const proxy = importsInFolderTypeFindLayerBrokerProxy();
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-missing.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupMissing();

      const result = importsInFolderTypeFindLayerBroker({
        sourceFile,
        packageSrcPath,
        folderType: 'flows',
      });

      expect(result).toStrictEqual([]);
    });
  });
});
