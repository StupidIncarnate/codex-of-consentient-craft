import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
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

export const listDirEntriesLayerBrokerProxy = (): {
  setupFiles: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }) => Dirent[];
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupFiles: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }): Dirent[] => {
      const entries = names.map((name) => buildDirent({ name, isDir: false }));
      fsProxy.returns({ dirPath, entries });
      return entries;
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      fsProxy.returns({ dirPath, entries: [] });
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      fsProxy.throws({ dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
