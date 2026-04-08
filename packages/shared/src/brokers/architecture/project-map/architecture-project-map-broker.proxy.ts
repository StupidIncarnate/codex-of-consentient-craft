import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { countFilesRecursiveLayerBrokerProxy } from './count-files-recursive-layer-broker.proxy';
import { formatFolderContentLayerBrokerProxy } from './format-folder-content-layer-broker.proxy';
import { readPackageDescriptionLayerBrokerProxy } from './read-package-description-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const DEFAULT_LEAF_FILE_COUNT = 3;

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

const fillLeafDirectories = <K extends PropertyKey>(pathMap: Map<K, Dirent[]>): void => {
  const registeredPaths = new Set(pathMap.keys());

  const leafEntries: [K, Dirent[]][] = [];

  for (const [parentPath, entries] of pathMap) {
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = `${String(parentPath)}/${entry.name}` as K;
        if (!registeredPaths.has(childPath)) {
          leafEntries.push([
            childPath,
            Array.from({ length: DEFAULT_LEAF_FILE_COUNT }, (_, i) =>
              makeDirent({ name: `file-${String(i + 1)}.ts`, isDir: false }),
            ),
          ]);
        }
      }
    }
  }

  for (const [leafPath, files] of leafEntries) {
    pathMap.set(leafPath, files);
  }
};

export const architectureProjectMapBrokerProxy = (): {
  setupMonorepo: ({
    packages,
  }: {
    packages: {
      name: string;
      description?: ContentText;
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
    description?: ContentText;
  }) => void;
  setupEmptySrc: () => void;
} => {
  // Create all child proxies — the safeReaddir proxy is the one that reaches the I/O boundary
  const safeProxy = safeReaddirLayerBrokerProxy();
  countFilesRecursiveLayerBrokerProxy();
  formatFolderContentLayerBrokerProxy();
  const descriptionProxy = readPackageDescriptionLayerBrokerProxy();

  return {
    setupMonorepo: ({
      packages,
    }: {
      packages: {
        name: string;
        description?: ContentText;
        folders: {
          name: string;
          entries: { name: string; isDir: boolean }[];
          subEntries?: Record<string, { name: string; isDir: boolean }[]>;
        }[];
      }[];
    }): void => {
      const pathMap = new Map([['__init__', [] as Dirent[]]]);
      pathMap.delete('__init__');

      // Build description map for package.json reads
      const descriptionMap = new Map<ContentText, ContentText>();
      for (const pkg of packages) {
        if (pkg.description !== undefined) {
          descriptionMap.set(
            ContentTextStub({ value: `packages/${pkg.name}/package.json` }),
            pkg.description,
          );
        }
      }

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

      fillLeafDirectories(pathMap);

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

      descriptionProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          for (const [suffix, desc] of descriptionMap) {
            if (String(filePath).endsWith(String(suffix))) {
              return ContentTextStub({ value: JSON.stringify({ description: desc }) });
            }
          }
          throw new Error('ENOENT');
        },
      });
    },

    setupSingleRepo: ({
      folders,
      description,
    }: {
      folders: {
        name: string;
        entries: { name: string; isDir: boolean }[];
        subEntries?: Record<string, { name: string; isDir: boolean }[]>;
      }[];
      description?: ContentText;
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

      fillLeafDirectories(pathMap);

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

      descriptionProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          if (description !== undefined && String(filePath).endsWith('package.json')) {
            return ContentTextStub({ value: JSON.stringify({ description }) });
          }
          throw new Error('ENOENT');
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

      descriptionProxy.setupImplementation({
        fn: (): ContentText => {
          throw new Error('ENOENT');
        },
      });
    },
  };
};
