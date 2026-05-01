import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';

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

export const safeReaddirLayerBrokerProxy = (): {
  setupFiles: ({ names }: { names: string[] }) => void;
  setupDirs: ({ names }: { names: string[] }) => void;
  setupEmpty: () => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupFiles: ({ names }: { names: string[] }): void => {
      const entries = names.map((name) => buildDirent({ name, isDir: false }));
      fsProxy.returns({ entries });
    },

    setupDirs: ({ names }: { names: string[] }): void => {
      const entries = names.map((name) => buildDirent({ name, isDir: true }));
      fsProxy.returns({ entries });
    },

    setupEmpty: (): void => {
      fsProxy.returns({ entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
