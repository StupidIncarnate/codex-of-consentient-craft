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

export const listDirEntriesLayerBrokerProxy = (): {
  setupFiles: ({ names }: { names: string[] }) => Dirent[];
  setupEmpty: () => void;
  setupError: ({ error }: { error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupFiles: ({ names }: { names: string[] }): Dirent[] => {
      const entries = names.map((name) => buildDirent({ name, isDir: false }));
      fsProxy.returns({ entries });
      return entries;
    },

    setupEmpty: (): void => {
      fsProxy.returns({ entries: [] });
    },

    setupError: ({ error }: { error: Error }): void => {
      fsProxy.throws({ error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
