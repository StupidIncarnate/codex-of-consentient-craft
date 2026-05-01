import type { Dirent } from 'fs';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const buildFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const addToTree = (
  tree: Map<AbsoluteFilePath, Dirent[]>,
  dirPath: AbsoluteFilePath,
  entry: Dirent,
): void => {
  const existing = tree.get(dirPath) ?? [];
  const alreadyListed = existing.some((e) => e.name === entry.name);
  if (!alreadyListed) {
    existing.push(entry);
    tree.set(dirPath, existing);
  }
};

const addFilePathPartsToTree = (
  tree: Map<AbsoluteFilePath, Dirent[]>,
  parts: string[],
  depth: number,
): void => {
  if (depth >= parts.length) {
    return;
  }
  const parentDir = AbsoluteFilePathStub({ value: parts.slice(0, depth).join('/') || '/' });
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

const addFilePathToTree = (
  tree: Map<AbsoluteFilePath, Dirent[]>,
  filePath: AbsoluteFilePath,
): void => {
  const parts = String(filePath).split('/');
  addFilePathPartsToTree(tree, parts, 1);
};

export const importEdgesLayerBrokerProxy = (): {
  setup: ({
    projectRoot,
    packages,
    sourceFiles,
  }: {
    projectRoot: AbsoluteFilePath;
    packages: ContentText[];
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
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
      projectRoot: AbsoluteFilePath;
      packages: ContentText[];
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      const root = String(projectRoot);

      // Build a unified virtual directory tree covering:
      // - packages/ (one dir entry per package)
      // - packages/<P>/src/... (full file paths for source files)
      const tree = new Map<AbsoluteFilePath, Dirent[]>();

      const packagesDir = AbsoluteFilePathStub({ value: `${root}/packages` });
      for (const pkg of packages) {
        addToTree(tree, packagesDir, buildDirDirent({ name: String(pkg) }));
      }

      for (const file of sourceFiles) {
        addFilePathToTree(tree, file.path);
      }

      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          const key = AbsoluteFilePathStub({ value: dirPath });
          return tree.get(key) ?? [];
        },
      });

      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const file of sourceFiles) {
        fileMap.set(file.path, file.source);
      }

      readFileProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          for (const [key, content] of fileMap) {
            if (String(key) === String(filePath)) {
              return content;
            }
          }
          return filePath;
        },
      });
    },
  };
};
