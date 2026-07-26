import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const dirExistsInParentLayerBrokerProxy = (): {
  setupWithDir: ({
    parentDirPath,
    dirName,
  }: {
    parentDirPath: AbsoluteFilePath;
    dirName: string;
  }) => void;
  setupEmpty: ({ parentDirPath }: { parentDirPath: AbsoluteFilePath }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

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
    setupWithDir: ({
      parentDirPath,
      dirName,
    }: {
      parentDirPath: AbsoluteFilePath;
      dirName: string;
    }): void => {
      readdirProxy.setupDirectory({
        dirPath: parentDirPath,
        entries: [makeDirDirent({ name: dirName }), makeDirDirent({ name: 'other' })],
      });
    },

    setupEmpty: ({ parentDirPath }: { parentDirPath: AbsoluteFilePath }): void => {
      readdirProxy.setupDirectory({ dirPath: parentDirPath, entries: [] });
    },
  };
};
