import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): DirEntrySync => ({
  name,
  kind: isDir ? 'directory' : 'file',
});

export const countFilesRecursiveLayerBrokerProxy = (): {
  setupFlatDirectory: ({
    dirPath,
    fileNames,
  }: {
    dirPath: string;
    fileNames: string[];
  }) => void;
  setupNestedDirectory: ({
    dirPath,
    files,
    subdirs,
  }: {
    dirPath: string;
    files: string[];
    subdirs: { name: string; files: string[] }[];
  }) => void;
  setupEmpty: ({ dirPath }: { dirPath: string }) => void;
  setupError: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({
      dirPath,
      fileNames,
    }: {
      dirPath: string;
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
      dirPath: string;
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
          dirPath: `${String(dirPath)}/${sub.name}`,
          entries: sub.files.map((name) => makeDirent({ name, isDir: false })),
        });
      }
    },

    setupEmpty: ({ dirPath }: { dirPath: string }): void => {
      safeProxy.setupDirectory({ dirPath, entries: [] });
    },

    setupError: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      safeProxy.setupError({ dirPath, error });
    },
  };
};
