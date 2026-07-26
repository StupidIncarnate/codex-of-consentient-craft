import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

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
        entries: fileNames.map((name) => makeFileDirent({ name })),
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
