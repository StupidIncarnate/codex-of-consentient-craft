import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { Dirent } from 'fs';

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

const buildDirTree = ({
  filePaths,
}: {
  filePaths: AbsoluteFilePath[];
}): Map<AbsoluteFilePath, Set<AbsoluteFilePath>> => {
  const dirTree = new Map<AbsoluteFilePath, Set<AbsoluteFilePath>>();

  for (const p of filePaths) {
    const keyStr = String(p);
    const segments = keyStr.split('/');

    segments.forEach((_seg, i) => {
      if (i === 0) return;
      const parentPath = segments.slice(0, i).join('/') || '/';
      const childName = segments[i];

      if (childName === undefined) return;

      const parentKey = parentPath as unknown as AbsoluteFilePath;
      if (!dirTree.has(parentKey)) {
        dirTree.set(parentKey, new Set());
      }

      const childFull = `${parentPath}/${childName}` as unknown as AbsoluteFilePath;
      dirTree.get(parentKey)?.add(childFull);
    });
  }

  return dirTree;
};

export const listSourceFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }) => void;
  setupEmpty: () => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({ filePaths }: { filePaths: AbsoluteFilePath[] }): void => {
      const dirTree = buildDirTree({ filePaths });
      const fileSet = new Set(filePaths.map(String));

      readdirProxy.implementation({
        fn: (dirPath: string): Dirent[] => {
          const dirKey = dirPath as unknown as AbsoluteFilePath;
          const children = dirTree.get(dirKey);

          if (children === undefined) {
            return [];
          }

          return [...children].map((fullPath) => {
            const name = String(fullPath).slice(dirPath.length + 1);
            return fileSet.has(String(fullPath))
              ? buildFileDirent({ name })
              : buildDirDirent({ name });
          });
        },
      });
    },

    setupEmpty: (): void => {
      readdirProxy.returns({ entries: [] });
    },
  };
};
