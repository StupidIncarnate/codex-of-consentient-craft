import type { Dirent } from 'fs';

import {
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
  pathResolveAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadlinkAdapterProxy } from '../../../adapters/fs/readlink/fs-readlink-adapter.proxy';

const buildDirent = ({
  name,
  isDir,
  isSymlink,
}: {
  name: string;
  isDir: boolean;
  isSymlink: boolean;
}): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir && !isSymlink,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => isSymlink,
  }) as Dirent;

export const walkSymlinksLayerBrokerProxy = (): {
  setupDirectoryEntries: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupReadlinkTarget: (params: { linkPath: FilePath; target: string }) => void;
  setupReadlinkThrows: (params: { linkPath: FilePath; error: Error }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const readlinkProxy = fsReadlinkAdapterProxy();
  // Both wired to satisfy enforce-proxy-child-creation and both left UNADDRESSED on purpose: each
  // defaults to a real passthrough, so every path a test stages must match Node's own
  // path.join / path.resolve output byte-for-byte.
  pathJoinAdapterProxy();
  pathResolveAdapterProxy();

  return {
    setupDirectoryEntries: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      readdirProxy.returns({
        dirPath,
        entries: entries.map(({ name, isDir, isSymlink }) =>
          buildDirent({ name, isDir, isSymlink }),
        ),
      });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      readlinkProxy.returns({ linkPath, target });
    },

    setupReadlinkThrows: ({ linkPath, error }: { linkPath: FilePath; error: Error }): void => {
      readlinkProxy.throws({ linkPath, error });
    },
  };
};
