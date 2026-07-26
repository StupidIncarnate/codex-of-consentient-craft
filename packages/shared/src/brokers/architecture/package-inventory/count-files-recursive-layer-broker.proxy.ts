import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
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

export const countFilesRecursiveLayerBrokerProxy = (): {
  setupFlatDirectory: ({
    dirPath,
    fileNames,
  }: {
    dirPath: AbsoluteFilePath;
    fileNames: string[];
  }) => void;
  setupNestedDirectory: ({
    dirPath,
    files,
    subdirs,
  }: {
    dirPath: AbsoluteFilePath;
    files: string[];
    subdirs: { name: string; files: string[] }[];
  }) => void;
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({
      dirPath,
      fileNames,
    }: {
      dirPath: AbsoluteFilePath;
      fileNames: string[];
    }): void => {
      safeProxy.setupDirectory({
        dirPath,
        entries: fileNames.map((name) => makeDirent({ name, isDir: false })),
      });
    },

    setupNestedDirectory: ({
      dirPath,
      files,
      subdirs,
    }: {
      dirPath: AbsoluteFilePath;
      files: string[];
      subdirs: { name: string; files: string[] }[];
    }): void => {
      const rootEntries = [
        ...files.map((name) => makeDirent({ name, isDir: false })),
        ...subdirs.map((sub) => makeDirent({ name: sub.name, isDir: true })),
      ];
      safeProxy.setupDirectory({ dirPath, entries: rootEntries });

      for (const sub of subdirs) {
        safeProxy.setupDirectory({
          dirPath: AbsoluteFilePathStub({ value: `${String(dirPath)}/${sub.name}` }),
          entries: sub.files.map((name) => makeDirent({ name, isDir: false })),
        });
      }
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      safeProxy.setupDirectory({ dirPath, entries: [] });
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      safeProxy.setupError({ dirPath, error });
    },
  };
};
