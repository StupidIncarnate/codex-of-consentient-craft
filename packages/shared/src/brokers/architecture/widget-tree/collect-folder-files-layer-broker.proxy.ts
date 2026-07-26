import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const collectFolderFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({
    dirPath,
    filePaths,
  }: {
    dirPath: AbsoluteFilePath;
    filePaths: AbsoluteFilePath[];
  }) => void;
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({
      dirPath,
      filePaths,
    }: {
      dirPath: AbsoluteFilePath;
      filePaths: AbsoluteFilePath[];
    }): void => {
      const names = filePaths.map((fp) => {
        const parts = String(fp).split('/');
        return parts[parts.length - 1] ?? String(fp);
      });
      readdirProxy.setupFiles({ dirPath, names });
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readdirProxy.setupEmpty({ dirPath });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
