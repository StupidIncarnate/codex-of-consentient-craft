import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

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
  setupFlatDirectory: ({ fileNames }: { fileNames: string[] }) => void;
  setupNestedDirectory: ({
    files,
    subdirs,
  }: {
    files: string[];
    subdirs: { name: string; files: string[] }[];
  }) => void;
  setupEmpty: () => void;
  setupError: ({ error }: { error: Error }) => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({ fileNames }: { fileNames: string[] }): void => {
      safeProxy.setupDirectory({
        entries: fileNames.map((name) => makeDirent({ name, isDir: false })),
      });
    },

    setupNestedDirectory: ({
      files,
      subdirs,
    }: {
      files: string[];
      subdirs: { name: string; files: string[] }[];
    }): void => {
      const rootEntries = [
        ...files.map((name) => makeDirent({ name, isDir: false })),
        ...subdirs.map((sub) => makeDirent({ name: sub.name, isDir: true })),
      ];
      safeProxy.setupDirectory({ entries: rootEntries });

      for (const sub of subdirs) {
        safeProxy.setupDirectory({
          entries: sub.files.map((name) => makeDirent({ name, isDir: false })),
        });
      }
    },

    setupEmpty: (): void => {
      safeProxy.setupDirectory({ entries: [] });
    },

    setupError: ({ error }: { error: Error }): void => {
      safeProxy.setupError({ error });
    },
  };
};
