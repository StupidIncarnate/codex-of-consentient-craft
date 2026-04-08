import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { countFilesRecursiveLayerBrokerProxy } from './count-files-recursive-layer-broker.proxy';
import { formatFolderContentLayerBrokerProxy } from './format-folder-content-layer-broker.proxy';

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

export const architectureProjectMapBrokerProxy = (): {
  setupMonorepo: ({
    packages,
  }: {
    packages: {
      name: string;
      folders: {
        name: string;
        entries: { name: string; isDir: boolean }[];
        subEntries?: Record<string, { name: string; isDir: boolean }[]>;
      }[];
    }[];
  }) => void;
  setupSingleRepo: ({
    folders,
  }: {
    folders: {
      name: string;
      entries: { name: string; isDir: boolean }[];
      subEntries?: Record<string, { name: string; isDir: boolean }[]>;
    }[];
  }) => void;
  setupEmptySrc: () => void;
} => {
  // Create all child proxies — the safeReaddir proxy is the one that reaches the I/O boundary
  const safeProxy = safeReaddirLayerBrokerProxy();
  countFilesRecursiveLayerBrokerProxy();
  formatFolderContentLayerBrokerProxy();

  return {
    setupMonorepo: ({
      packages,
    }: {
      packages: {
        name: string;
        folders: {
          name: string;
          entries: { name: string; isDir: boolean }[];
          subEntries?: Record<string, { name: string; isDir: boolean }[]>;
        }[];
      }[];
    }): void => {
      const pathMap = new Map([['__init__', [] as Dirent[]]]);
      pathMap.delete('__init__');

      // packages/ directory listing
      pathMap.set(
        'packages',
        packages.map((pkg) => makeDirent({ name: pkg.name, isDir: true })),
      );

      for (const pkg of packages) {
        pathMap.set(
          `packages/${pkg.name}/src`,
          pkg.folders.map((folder) => makeDirent({ name: folder.name, isDir: true })),
        );

        for (const folder of pkg.folders) {
          pathMap.set(
            `packages/${pkg.name}/src/${folder.name}`,
            folder.entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
          );

          if (folder.subEntries !== undefined) {
            for (const [subName, subItems] of Object.entries(folder.subEntries)) {
              pathMap.set(
                `packages/${pkg.name}/src/${folder.name}/${subName}`,
                subItems.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
              );
            }
          }
        }
      }

      safeProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          for (const [suffix, entries] of pathMap) {
            if (dirPath.endsWith(suffix)) {
              return entries;
            }
          }
          return [];
        },
      });
    },

    setupSingleRepo: ({
      folders,
    }: {
      folders: {
        name: string;
        entries: { name: string; isDir: boolean }[];
        subEntries?: Record<string, { name: string; isDir: boolean }[]>;
      }[];
    }): void => {
      const pathMap = new Map([['__init__', [] as Dirent[]]]);
      pathMap.delete('__init__');

      pathMap.set(
        '/src',
        folders.map((folder) => makeDirent({ name: folder.name, isDir: true })),
      );

      for (const folder of folders) {
        pathMap.set(
          `/src/${folder.name}`,
          folder.entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
        );

        if (folder.subEntries !== undefined) {
          for (const [subName, subItems] of Object.entries(folder.subEntries)) {
            pathMap.set(
              `/src/${folder.name}/${subName}`,
              subItems.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
            );
          }
        }
      }

      safeProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath.endsWith('/packages')) {
            throw new Error('ENOENT');
          }

          for (const [suffix, entries] of pathMap) {
            if (dirPath.endsWith(suffix)) {
              return entries;
            }
          }
          return [];
        },
      });
    },

    setupEmptySrc: (): void => {
      safeProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath.endsWith('/packages')) {
            throw new Error('ENOENT');
          }
          return [];
        },
      });
    },
  };
};
