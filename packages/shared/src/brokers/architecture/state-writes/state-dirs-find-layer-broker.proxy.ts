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

export const stateDirsFindLayerBrokerProxy = (): {
  setupStateDirs: ({ names }: { names: string[] }) => void;
  setupEmpty: () => void;
  setupMissing: () => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupStateDirs: ({ names }: { names: string[] }): void => {
      const entries = names.map((name) => buildDirDirent({ name }));
      readdirProxy.setupDirectory({ entries });
    },

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },

    setupMissing: (): void => {
      readdirProxy.setupError({ error: new Error('ENOENT: no such file or directory') });
    },
  };
};
