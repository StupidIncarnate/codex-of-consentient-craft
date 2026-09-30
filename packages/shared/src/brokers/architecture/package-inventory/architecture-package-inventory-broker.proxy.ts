import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { countFilesRecursiveLayerBrokerProxy } from './count-files-recursive-layer-broker.proxy';
import { formatFolderContentLayerBrokerProxy } from './format-folder-content-layer-broker.proxy';
import { readPackageDescriptionLayerBrokerProxy } from './read-package-description-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

const DEFAULT_LEAF_FILE_COUNT = 3;

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  DirentStub({ name, kind: isDir ? 'directory' : 'file' });

const fillLeafDirectories = (pathMap: Map<ContentText, Dirent[]>): void => {
  const registeredPaths = new Set(pathMap.keys());

  const leafEntries: [ContentText, Dirent[]][] = [];

  for (const [parentPath, entries] of pathMap) {
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = ContentTextStub({ value: `${String(parentPath)}/${entry.name}` });
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

const buildPackagePathMap = ({
  packageName,
  folders,
  pathMap,
}: {
  packageName: string;
  folders: {
    name: string;
    entries: { name: string; isDir: boolean }[];
    subEntries?: Record<string, { name: string; isDir: boolean }[]>;
  }[];
  pathMap: Map<ContentText, Dirent[]>;
}): void => {
  pathMap.set(
    ContentTextStub({ value: `packages/${packageName}/src` }),
    folders.map((folder) => makeDirent({ name: folder.name, isDir: true })),
  );

  for (const folder of folders) {
    pathMap.set(
      ContentTextStub({ value: `packages/${packageName}/src/${folder.name}` }),
      folder.entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
    );

    if (folder.subEntries !== undefined) {
      for (const [subName, subItems] of Object.entries(folder.subEntries)) {
        pathMap.set(
          ContentTextStub({
            value: `packages/${packageName}/src/${folder.name}/${subName}`,
          }),
          subItems.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
        );
      }
    }
  }
};

export const architecturePackageInventoryBrokerProxy = (): {
  setupEmpty: ({
    srcPath,
    packageJsonPath,
  }: {
    srcPath: string;
    packageJsonPath: string;
  }) => void;
  setupPackage: ({
    packageName,
    description,
    folders,
  }: {
    packageName: string;
    description?: ContentText;
    folders: {
      name: string;
      entries: { name: string; isDir: boolean }[];
      subEntries?: Record<string, { name: string; isDir: boolean }[]>;
    }[];
  }) => void;
  setupMonorepoPackages: ({
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
    description,
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
  const safeProxy = safeReaddirLayerBrokerProxy();
  countFilesRecursiveLayerBrokerProxy();
  formatFolderContentLayerBrokerProxy();
  const descriptionProxy = readPackageDescriptionLayerBrokerProxy();

  return {
    setupEmpty: ({
      srcPath,
      packageJsonPath,
    }: {
      srcPath: string;
      packageJsonPath: string;
    }): void => {
      safeProxy.setupDirectory({ dirPath: srcPath, entries: [] });
      descriptionProxy.setupNoPackageJson({ packageJsonPath });
    },

    setupPackage: ({
      packageName,
      description,
      folders,
    }: {
      packageName: string;
      description?: ContentText;
      folders: {
        name: string;
        entries: { name: string; isDir: boolean }[];
        subEntries?: Record<string, { name: string; isDir: boolean }[]>;
      }[];
    }): void => {
      const pathMap = new Map<ContentText, Dirent[]>();
      buildPackagePathMap({ packageName, folders, pathMap });
      fillLeafDirectories(pathMap);

      safeProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          for (const [suffix, entries] of pathMap) {
            if (dirPath.endsWith(String(suffix))) {
              return entries;
            }
          }
          return [];
        },
      });

      descriptionProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          if (
            description !== undefined &&
            String(filePath).endsWith(`packages/${packageName}/package.json`)
          ) {
            return ContentTextStub({ value: JSON.stringify({ description }) });
          }
          throw FileMissingErrorStub({ path: String(filePath) });
        },
      });
    },

    setupMonorepoPackages: ({
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
      const pathMap = new Map<ContentText, Dirent[]>();
      const descriptions = new Map<ContentText, ContentText>();

      for (const pkg of packages) {
        buildPackagePathMap({ packageName: pkg.name, folders: pkg.folders, pathMap });
        if (pkg.description !== undefined) {
          descriptions.set(
            ContentTextStub({ value: `packages/${pkg.name}/package.json` }),
            pkg.description,
          );
        }
      }

      fillLeafDirectories(pathMap);

      safeProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          for (const [suffix, entries] of pathMap) {
            if (dirPath.endsWith(String(suffix))) {
              return entries;
            }
          }
          return [];
        },
      });

      descriptionProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          for (const [suffix, desc] of descriptions) {
            if (String(filePath).endsWith(String(suffix))) {
              return ContentTextStub({ value: JSON.stringify({ description: desc }) });
            }
          }
          throw FileMissingErrorStub({ path: String(filePath) });
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
      const pathMap = new Map<ContentText, Dirent[]>();

      pathMap.set(
        ContentTextStub({ value: '/src' }),
        folders.map((folder) => makeDirent({ name: folder.name, isDir: true })),
      );

      for (const folder of folders) {
        pathMap.set(
          ContentTextStub({ value: `/src/${folder.name}` }),
          folder.entries.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
        );

        if (folder.subEntries !== undefined) {
          for (const [subName, subItems] of Object.entries(folder.subEntries)) {
            pathMap.set(
              ContentTextStub({ value: `/src/${folder.name}/${subName}` }),
              subItems.map((entry) => makeDirent({ name: entry.name, isDir: entry.isDir })),
            );
          }
        }
      }

      fillLeafDirectories(pathMap);

      safeProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          for (const [suffix, entries] of pathMap) {
            if (dirPath.endsWith(String(suffix))) {
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
          throw FileMissingErrorStub({ path: String(filePath) });
        },
      });
    },

    setupEmptySrc: (): void => {
      safeProxy.setupImplementation({
        fn: (): Dirent[] => [],
      });

      descriptionProxy.setupImplementation({
        fn: (): ContentText => {
          throw FileMissingErrorStub();
        },
      });
    },
  };
};
