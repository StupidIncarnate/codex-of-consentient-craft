import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { Dirent } from 'fs';

export const findFirstStartupFileLayerBrokerProxy = (): {
  setupFiles: ({ fileNames }: { fileNames: readonly string[] }) => void;
  setupEmpty: () => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFiles: ({ fileNames }: { fileNames: readonly string[] }): void => {
      const entries = fileNames.map(
        (name) =>
          ({
            name,
            isDirectory: () => false,
            isFile: () => true,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
            isSymbolicLink: () => false,
          }) as Dirent,
      );
      readdirProxy.setupDirectory({ entries });
    },

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },
  };
};
