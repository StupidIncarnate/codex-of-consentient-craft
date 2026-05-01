import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const findFirstFlowFileRecursiveLayerBrokerProxy = (): {
  setupFlat: ({ fileNames }: { fileNames: readonly string[] }) => void;
  setupNested: ({
    subDirName,
    fileNames,
  }: {
    subDirName: string;
    fileNames: readonly string[];
  }) => void;
  setupEmpty: () => void;
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
    setupFlat: ({ fileNames }: { fileNames: readonly string[] }): void => {
      readdirProxy.setupDirectory({ entries: fileNames.map((name) => makeFileDirent({ name })) });
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

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },
  };
};
