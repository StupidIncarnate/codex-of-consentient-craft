import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const dirExistsInParentLayerBrokerProxy = (): {
  setupWithDir: ({
    parentDirPath,
    dirName,
  }: {
    parentDirPath: string;
    dirName: string;
  }) => void;
  setupEmpty: ({ parentDirPath }: { parentDirPath: string }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  const makeDirDirent = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'directory' });

  return {
    setupWithDir: ({
      parentDirPath,
      dirName,
    }: {
      parentDirPath: string;
      dirName: string;
    }): void => {
      readdirProxy.setupDirectory({
        dirPath: parentDirPath,
        entries: [makeDirDirent({ name: dirName }), makeDirDirent({ name: 'other' })],
      });
    },

    setupEmpty: ({ parentDirPath }: { parentDirPath: string }): void => {
      readdirProxy.setupDirectory({ dirPath: parentDirPath, entries: [] });
    },
  };
};
