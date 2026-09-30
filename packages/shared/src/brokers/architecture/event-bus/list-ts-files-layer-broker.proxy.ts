import type { Dirent } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

const buildFileDirent = ({ name }: { name: string }): Dirent => DirentStub({ name, kind: 'file' });

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  DirentStub({ name, kind: 'directory' });

const populateVirtualTree = (tree: Map<string, Dirent[]>, parts: string[], depth: number): void => {
  if (depth >= parts.length) {
    return;
  }
  const parentDir = parts.slice(0, depth).join('/') || '/';
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

const buildVirtualTree = (filePaths: string[]): Map<string, Dirent[]> => {
  const tree = new Map<string, Dirent[]>();
  for (const fp of filePaths) {
    populateVirtualTree(tree, fp.split('/'), 1);
  }
  return tree;
};

export const listTsFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({ dirPath, filePaths }: { dirPath: string; filePaths: string[] }) => void;
  setupEmpty: ({ dirPath }: { dirPath: string }) => void;
  setupVirtualTree: ({ filePaths }: { filePaths: string[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({
      dirPath,
      filePaths,
    }: {
      dirPath: string;
      filePaths: string[];
    }): void => {
      const entries: DirEntrySync[] = filePaths.map((fp) => {
        const parts = fp.split('/');
        const name = parts[parts.length - 1] ?? fp;
        return { name, kind: 'file' as const };
      });
      readdirProxy.setupDirectory({ dirPath, entries });
    },

    setupEmpty: ({ dirPath }: { dirPath: string }): void => {
      readdirProxy.setupDirectory({ dirPath, entries: [] });
    },

    setupVirtualTree: ({ filePaths }: { filePaths: string[] }): void => {
      const tree = buildVirtualTree(filePaths);
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          const key = dirPath;
          return tree.get(key) ?? [];
        },
      });
    },
  };
};
