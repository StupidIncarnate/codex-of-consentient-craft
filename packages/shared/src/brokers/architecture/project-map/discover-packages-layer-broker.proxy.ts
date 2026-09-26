import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
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

export const discoverPackagesLayerBrokerProxy = (): {
  setupPackages: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  // A `@scope` entry staged via setupPackages triggers a SECOND fsReaddirWithTypesAdapter call
  // into that group's own directory, joined the same way the broker joins it — keyed here so a
  // test can describe a group's children without duplicating that join itself.
  setupGroupFolder: (params: {
    dirPath: AbsoluteFilePath;
    groupName: string;
    entries: { name: string; isDirectory: boolean }[];
  }) => void;
  setupMissingPackagesDir: (params: { dirPath: AbsoluteFilePath }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupPackages: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      fsProxy.returns({
        dirPath,
        entries: entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDirectory })),
      });
    },

    setupGroupFolder: ({
      dirPath,
      groupName,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      groupName: string;
      entries: { name: string; isDirectory: boolean }[];
    }): void => {
      fsProxy.returns({
        dirPath: AbsoluteFilePathStub({ value: `${String(dirPath)}/${groupName}` }),
        entries: entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDirectory })),
      });
    },

    setupMissingPackagesDir: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      fsProxy.throws({ dirPath, error: new Error('ENOENT') });
    },
  };
};
