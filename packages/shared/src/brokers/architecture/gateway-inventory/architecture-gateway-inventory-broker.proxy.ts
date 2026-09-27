import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { gatewayLintConfigReadBrokerProxy } from '../../gateway-lint-config/read/gateway-lint-config-read-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

const makeDirEntry = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const architectureGatewayInventoryBrokerProxy = (): {
  setupSubpath: ({
    projectRoot,
    folder,
    subpathName,
    barrelContent,
  }: {
    projectRoot: AbsoluteFilePath;
    folder: string;
    subpathName: string;
    barrelContent?: ContentText;
  }) => void;
  setupGatewayLintConfig: ({
    repoRoot,
    fileContent,
  }: {
    repoRoot: AbsoluteFilePath;
    fileContent: ContentText;
  }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  const lintConfigProxy = gatewayLintConfigReadBrokerProxy();

  const entriesByFolderSrcPath = new Map<ContentText, Dirent[]>();

  return {
    setupSubpath: ({
      projectRoot,
      folder,
      subpathName,
      barrelContent,
    }: {
      projectRoot: AbsoluteFilePath;
      folder: string;
      subpathName: string;
      barrelContent?: ContentText;
    }): void => {
      const folderSrcPath = AbsoluteFilePathStub({
        value: `${String(projectRoot)}/packages/@gateway/${folder}/src`,
      });
      const folderSrcPathKey = ContentTextStub({ value: String(folderSrcPath) });

      const existingEntries = entriesByFolderSrcPath.get(folderSrcPathKey) ?? [];
      const entries = [...existingEntries, makeDirEntry({ name: subpathName })];
      entriesByFolderSrcPath.set(folderSrcPathKey, entries);
      readdirProxy.returns({ dirPath: folderSrcPath, entries });

      if (barrelContent !== undefined) {
        const barrelPath = AbsoluteFilePathStub({
          value: `${String(folderSrcPath)}/${subpathName}/${subpathName}.ts`,
        });
        existsProxy.returns({
          filePath: FilePathStub({ value: String(barrelPath) }),
          result: true,
        });
        readProxy.returns({ filePath: barrelPath, content: barrelContent });
      }
    },

    setupGatewayLintConfig: ({
      repoRoot,
      fileContent,
    }: {
      repoRoot: AbsoluteFilePath;
      fileContent: ContentText;
    }): void => {
      lintConfigProxy.setupConfig({
        configPath: AbsoluteFilePathStub({ value: `${String(repoRoot)}/.dungeonmaster.json` }),
        fileContent,
      });
    },
  };
};
