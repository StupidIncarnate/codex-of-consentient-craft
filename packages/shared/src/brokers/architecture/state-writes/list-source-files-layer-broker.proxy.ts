import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const buildDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const listSourceFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }) => void;
  setupEmpty: () => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }): void => {
      const entries = filePaths.map((fp) => {
        const name = String(fp).split('/').pop() ?? String(fp);
        return buildDirent({ name, isDir: false });
      });
      readdirProxy.setupDirectory({ entries });
    },

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
