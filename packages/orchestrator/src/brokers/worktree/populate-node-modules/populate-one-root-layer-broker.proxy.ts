import type { Dirent } from 'fs';

import {
  fsMkdirAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
  locationsNodeModulesPathFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadlinkAdapterProxy } from '../../../adapters/fs/readlink/fs-readlink-adapter.proxy';
import { fsSymlinkAdapterProxy } from '../../../adapters/fs/symlink/fs-symlink-adapter.proxy';

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

export const populateOneRootLayerBrokerProxy = (): {
  setupDirectoryEntries: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupTargetNodeModulesOnDisk: (params: {
    targetRoot: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupReadlinkTarget: (params: { linkPath: FilePath; target: string }) => void;
  setupMkdirThrows: (params: { filepath: FilePath; error: Error }) => void;
  setupSymlinkSucceeds: (params: { target: FilePath }) => void;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const symlinkProxy = fsSymlinkAdapterProxy();
  const readlinkProxy = fsReadlinkAdapterProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // Every root's done-check asks whether its TARGET node_modules is already there. "Not there" is
  // the honest default for a fresh worktree, so an undescribed target mirrors; a target described
  // by setupTargetNodeModulesOnDisk below outranks this catch-all and skips.
  isAccessibleProxy.defaultsToNotFound();
  // Both are wired to satisfy enforce-proxy-child-creation and both are left UNADDRESSED on
  // purpose: pathJoinAdapter's proxy defaults to a real path.join passthrough, and the locations
  // resolver stages nothing of its own, so every joined path used to stage the adapters above must
  // match Node's actual path.join output byte-for-byte.
  pathJoinAdapterProxy();
  locationsNodeModulesPathFindBrokerProxy();

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

    // Describes what is ALREADY on disk at the target root's node_modules. The done-check needs
    // both halves — reachable AND non-empty — so passing `entries: []` describes the directory a
    // previous attempt created and then died before filling, which is NOT done.
    setupTargetNodeModulesOnDisk: ({
      targetRoot,
      entries,
    }: {
      targetRoot: AbsoluteFilePath;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      isAccessibleProxy.resolves({
        filePath: FilePathStub({ value: `${targetRoot}/node_modules` }),
      });
      readdirProxy.returns({
        dirPath: AbsoluteFilePathStub({ value: `${targetRoot}/node_modules` }),
        entries: entries.map(({ name, isDir, isSymlink }) =>
          buildDirent({ name, isDir, isSymlink }),
        ),
      });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      readlinkProxy.returns({ linkPath, target });
    },
    setupMkdirThrows: ({ filepath, error }: { filepath: FilePath; error: Error }): void => {
      mkdirProxy.throws({ filepath, error });
    },
    setupSymlinkSucceeds: ({ target }: { target: FilePath }): void => {
      symlinkProxy.succeeds({ target });
    },
    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      symlinkProxy.getAllSymlinks(),
  };
};
