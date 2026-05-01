import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const collectFolderFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }) => void;
  setupEmpty: () => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }): void => {
      const names = filePaths.map((fp) => {
        const parts = String(fp).split('/');
        return parts[parts.length - 1] ?? String(fp);
      });
      readdirProxy.setupFiles({ names });
    },

    setupEmpty: (): void => {
      readdirProxy.setupEmpty();
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
