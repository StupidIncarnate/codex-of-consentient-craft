import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const dirExistsInParentLayerBrokerProxy = (): {
  setupWithDir: ({ dirName }: { dirName: string }) => void;
  setupEmpty: () => void;
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
    setupWithDir: ({ dirName }: { dirName: string }): void => {
      readdirProxy.setupDirectory({
        entries: [makeDirDirent({ name: dirName }), makeDirDirent({ name: 'other' })],
      });
    },

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },
  };
};
