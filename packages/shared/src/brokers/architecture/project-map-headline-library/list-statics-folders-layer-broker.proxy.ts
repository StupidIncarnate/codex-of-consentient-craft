import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const listStaticsFoldersLayerBrokerProxy = (): {
  setupFolders: ({ folderNames }: { folderNames: string[] }) => void;
  setupMissing: () => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFolders: ({ folderNames }: { folderNames: string[] }): void => {
      safeProxy.setupDirectory({ entries: folderNames.map((name) => buildDirDirent({ name })) });
    },

    setupMissing: (): void => {
      safeProxy.setupError({ error: new Error('ENOENT') });
    },
  };
};
