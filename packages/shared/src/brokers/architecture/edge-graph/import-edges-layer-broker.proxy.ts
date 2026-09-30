import type { Dirent } from '#gateway/node/fs';
import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  DirentStub({ name, kind: 'directory' });

const buildFileDirent = ({ name }: { name: string }): Dirent => DirentStub({ name, kind: 'file' });

const addToTree = (tree: Map<string, Dirent[]>, dirPath: string, entry: Dirent): void => {
  const existing = tree.get(dirPath) ?? [];
  const alreadyListed = existing.some((e) => e.name === entry.name);
  if (!alreadyListed) {
    existing.push(entry);
    tree.set(dirPath, existing);
  }
};

const addFilePathPartsToTree = (
  tree: Map<string, Dirent[]>,
  parts: string[],
  depth: number,
): void => {
  if (depth >= parts.length) {
    return;
  }
  const parentDir = parts.slice(0, depth).join('/') || '/';
  const childName = parts[depth] ?? '';
  if (childName === '') {
    return;
  }
  const isFile = depth === parts.length - 1;
  addToTree(
    tree,
    parentDir,
    isFile ? buildFileDirent({ name: childName }) : buildDirDirent({ name: childName }),
  );
  addFilePathPartsToTree(tree, parts, depth + 1);
};

const addFilePathToTree = (tree: Map<string, Dirent[]>, filePath: string): void => {
  const parts = filePath.split('/');
  addFilePathPartsToTree(tree, parts, 1);
};

export const importEdgesLayerBrokerProxy = (): {
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
  // listTsFilesLayerBroker is called by importEdgesLayerBroker;
  // safeReaddirLayerBrokerProxy handles all readdir calls in the unified tree.
  listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();

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
      const root = projectRoot;

      // Build a unified virtual directory tree covering:
      // - packages/ (one dir entry per package)
      // - packages/<P>/src/... (full file paths for source files)
      const tree = new Map<string, Dirent[]>();

      const packagesDir = `${root}/packages`;
      for (const pkg of packages) {
        addToTree(tree, packagesDir, buildDirDirent({ name: pkg }));
      }

      for (const file of sourceFiles) {
        addFilePathToTree(tree, file.path);
      }

      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          const key = dirPath;
          return tree.get(key) ?? [];
        },
      });

      const fileMap = new Map<string, string>();
      for (const file of sourceFiles) {
        fileMap.set(file.path, file.source);
      }

      readFileProxy.setupImplementation({
        fn: (filePath: string): string => {
          for (const [key, content] of fileMap) {
            if (key === filePath) {
              return content;
            }
          }
          return filePath;
        },
      });
    },
  };
};
