import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { listTsFilesRecursiveLayerBrokerProxy } from './list-ts-files-recursive-layer-broker.proxy';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  DirentStub({ name, kind: 'directory' });

const buildFileDirent = ({ name }: { name: string }): Dirent => DirentStub({ name, kind: 'file' });

const addToTree = (
  tree: Map<string, Dirent[]>,
  dirPath: string,
  entry: Dirent,
): void => {
  const existing = tree.get(dirPath) ?? [];
  const alreadyListed = existing.some((e) => e.name === entry.name);
  if (!alreadyListed) {
    existing.push(entry);
    tree.set(dirPath, existing);
  }
};

const addPathToTree = (
  tree: Map<string, Dirent[]>,
  parts: string[],
  depth: number,
): void => {
  if (depth >= parts.length) {
    return;
  }
  const parentDir = (parts.slice(0, depth).map(String).join('/') || '/');
  const childName = String(parts[depth] ?? '');
  if (childName === '') {
    return;
  }
  const isFile = depth === parts.length - 1;
  addToTree(
    tree,
    parentDir,
    isFile ? buildFileDirent({ name: childName }) : buildDirDirent({ name: childName }),
  );
  addPathToTree(tree, parts, depth + 1);
};

export const architectureImportEdgesBrokerProxy = (): {
  setup: ({
    projectRoot,
    packages,
    sourceFiles,
  }: {
    projectRoot: string;
    packages: string[];
    sourceFiles: { path: string; source: string }[];
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readProxy = readSourceLayerBrokerProxy();
  listTsFilesRecursiveLayerBrokerProxy();

  return {
    setup: ({
      projectRoot,
      packages,
      sourceFiles,
    }: {
      projectRoot: string;
      packages: string[];
      sourceFiles: { path: string; source: string }[];
    }): void => {
      const root = String(projectRoot);

      // Build a unified virtual directory tree
      const tree = new Map<string, Dirent[]>();

      const packagesDir = `${root}/packages`;
      for (const pkg of packages) {
        addToTree(tree, packagesDir, buildDirDirent({ name: String(pkg) }));
      }

      for (const file of sourceFiles) {
        const parts = String(file.path)
          .split('/')
          .map((p) => p);
        addPathToTree(tree, parts, 1);
      }

      readdirProxy.setupImplementation({
        fn: (dirPath): Dirent[] => {
          const key = dirPath;
          return tree.get(key) ?? [];
        },
      });

      const fileMap = new Map<string, string>();
      for (const file of sourceFiles) {
        fileMap.set(file.path, file.source);
      }

      readProxy.implementation({
        fn: (filePath): string => {
          for (const [key, content] of fileMap) {
            if (String(key) === String(filePath)) {
              return content;
            }
          }
          return '';
        },
      });
    },
  };
};
