import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { DirEntrySync } from '#gateway/node/fs';

export const findFirstFlowFileRecursiveLayerBrokerProxy = (): {
  setupFlat: ({
    dirPath,
    fileNames,
  }: {
    dirPath: AbsoluteFilePath;
    fileNames: readonly string[];
  }) => void;
  setupNested: ({
    subDirName,
    fileNames,
  }: {
    subDirName: string;
    fileNames: readonly string[];
  }) => void;
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  // Feeds `readdirProxy.setupDirectory`, which composes the gateway's own `readdirEntriesSyncProxy`
  // — that proxy stages `{name, kind}` directly, never a raw `Dirent`.
  const makeFileDirEntrySync = ({ name }: { name: string }): DirEntrySync => ({
    name,
    kind: 'file',
  });

  // Feeds `readdirProxy.setupImplementation`, which registers directly on the raw `readdirSync`
  // mock — the gateway's own real `.map()` into `{name, kind}` still runs underneath, so these
  // must keep building the shape the real fs.Dirent's `isDirectory()`/`isFile()` methods provide.
  const makeFileDirent = ({ name }: { name: string }): Dirent =>
    ({
      name,
      isDirectory: () => false,
      isFile: () => true,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    }) as Dirent;

  const makeDirDirent = ({ name }: { name: string }): Dirent =>
    ({
      name,
      isDirectory: () => true,
      isFile: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    }) as Dirent;

  return {
    setupFlat: ({
      dirPath,
      fileNames,
    }: {
      dirPath: AbsoluteFilePath;
      fileNames: readonly string[];
    }): void => {
      readdirProxy.setupDirectory({
        dirPath,
        entries: fileNames.map((name) => makeFileDirEntrySync({ name })),
      });
    },

    setupNested: ({
      subDirName,
      fileNames,
    }: {
      subDirName: string;
      fileNames: readonly string[];
    }): void => {
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath.endsWith(`/${subDirName}`) || dirPath === subDirName) {
            return fileNames.map((name) => makeFileDirent({ name }));
          }
          return [makeDirDirent({ name: subDirName })];
        },
      });
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readdirProxy.setupDirectory({ dirPath, entries: [] });
    },
  };
};
