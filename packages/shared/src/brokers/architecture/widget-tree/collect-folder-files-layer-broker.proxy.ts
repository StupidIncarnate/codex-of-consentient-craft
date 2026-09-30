import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const collectFolderFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({ dirPath, filePaths }: { dirPath: string; filePaths: string[] }) => void;
  setupEmpty: ({ dirPath }: { dirPath: string }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({
      dirPath,
      filePaths,
    }: {
      dirPath: string;
      filePaths: string[];
    }): void => {
      const names = filePaths.map((fp) => {
        const parts = fp.split('/');
        return parts[parts.length - 1] ?? fp;
      });
      readdirProxy.setupFiles({ dirPath, names });
    },

    setupEmpty: ({ dirPath }: { dirPath: string }): void => {
      readdirProxy.setupEmpty({ dirPath });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
