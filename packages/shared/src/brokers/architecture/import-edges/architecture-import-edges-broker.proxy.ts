import type { Dirent } from 'fs';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { listTsFilesRecursiveLayerBrokerProxy } from './list-ts-files-recursive-layer-broker.proxy';

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

const addPathToTree = (
  tree: Map<AbsoluteFilePath, Dirent[]>,
  parts: ContentText[],
  depth: number,
): void => {
  if (depth >= parts.length) {
    return;
  }
  const parentDir = AbsoluteFilePathStub({
    value: parts.slice(0, depth).map(String).join('/') || '/',
  });
  const childName = String(parts[depth] ?? ContentTextStub({ value: '' }));
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
    projectRoot: AbsoluteFilePath;
    packages: ContentText[];
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
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
      projectRoot: AbsoluteFilePath;
      packages: ContentText[];
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      const root = String(projectRoot);

      // Build a unified virtual directory tree
      const tree = new Map<AbsoluteFilePath, Dirent[]>();

      const packagesDir = AbsoluteFilePathStub({ value: `${root}/packages` });
      for (const pkg of packages) {
        addToTree(tree, packagesDir, buildDirDirent({ name: String(pkg) }));
      }

      for (const file of sourceFiles) {
        const parts = String(file.path)
          .split('/')
          .map((p) => ContentTextStub({ value: p }));
        addPathToTree(tree, parts, 1);
      }

      readdirProxy.setupImplementation({
        fn: (dirPath): Dirent[] => {
          const key = AbsoluteFilePathStub({ value: dirPath });
          return tree.get(key) ?? [];
        },
      });

      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const file of sourceFiles) {
        fileMap.set(file.path, file.source);
      }

      readProxy.implementation({
        fn: (filePath): ContentText => {
          for (const [key, content] of fileMap) {
            if (String(key) === String(filePath)) {
              return content;
            }
          }
          return ContentTextStub({ value: '' });
        },
      });
    },
  };
};
