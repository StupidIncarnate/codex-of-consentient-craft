import type { Dirent } from 'fs';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

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

const populateVirtualTree = (
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
  const existing = tree.get(parentDir) ?? [];
  const alreadyListed = existing.some((e) => e.name === childName);
  if (!alreadyListed) {
    const dirent = isFile
      ? buildFileDirent({ name: childName })
      : buildDirDirent({ name: childName });
    existing.push(dirent);
    tree.set(parentDir, existing);
  }
  populateVirtualTree(tree, parts, depth + 1);
};

const buildVirtualTree = (filePaths: AbsoluteFilePath[]): Map<AbsoluteFilePath, Dirent[]> => {
  const tree = new Map<AbsoluteFilePath, Dirent[]>();
  for (const fp of filePaths) {
    populateVirtualTree(tree, String(fp).split('/'), 1);
  }
  return tree;
};

export const listTsFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }) => void;
  setupEmpty: () => void;
  setupVirtualTree: ({ filePaths }: { filePaths: AbsoluteFilePath[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }): void => {
      const entries = filePaths.map((fp) => {
        const parts = String(fp).split('/');
        const name = parts[parts.length - 1] ?? String(fp);
        return buildFileDirent({ name });
      });
      readdirProxy.setupDirectory({ entries });
    },

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },

    setupVirtualTree: ({ filePaths }: { filePaths: AbsoluteFilePath[] }): void => {
      const tree = buildVirtualTree(filePaths);
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          const key = AbsoluteFilePathStub({ value: dirPath });
          return tree.get(key) ?? [];
        },
      });
    },
  };
};
