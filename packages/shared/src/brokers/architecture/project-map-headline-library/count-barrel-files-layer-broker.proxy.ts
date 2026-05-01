import type { Dirent } from 'fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const buildFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const countBarrelFilesLayerBrokerProxy = (): {
  setupFiles: ({ dirPath, fileNames }: { dirPath: AbsoluteFilePath; fileNames: string[] }) => void;
  setupMissing: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFiles: ({ fileNames }: { dirPath: AbsoluteFilePath; fileNames: string[] }): void => {
      const entries = fileNames.map((name) => buildFileDirent({ name }));
      safeProxy.setupDirectory({ entries });
    },

    setupMissing: (): void => {
      safeProxy.setupError({ error: new Error('ENOENT') });
    },
  };
};
