import { locationsNodeModulesPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/node-modules-path-find/locations-node-modules-path-find-broker.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import type { FsError } from '#gateway/node/fs';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

import { populateOneRootLayerBrokerProxy } from './populate-one-root-layer-broker.proxy';

export const worktreePopulateNodeModulesBrokerProxy = (): {
  setupMkdirThrows: (params: { filepath: string; error: FsError }) => void;
  setupEmptyRepo: (params: { repoRoot: AbsoluteFilePath; worktreePath: AbsoluteFilePath }) => void;
  setupNoWorkspaceLinks: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    thirdPartyEntry: string;
  }) => void;
  setupWorkspacePackageWithNodeModules: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packageName: string;
    thirdPartyEntry: string;
  }) => void;
  setupWorkspacePackageWithoutNodeModules: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packageName: string;
  }) => void;
  setupWorkspacePackagePopulationRejects: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packageName: string;
    error: FsError;
  }) => void;
  setupRootTargetAlreadyPopulated: (params: { worktreePath: AbsoluteFilePath }) => void;
  setupPackageTargetAlreadyPopulated: (params: {
    worktreePath: AbsoluteFilePath;
    packageName: string;
  }) => void;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
  getAllCopyArgs: () => readonly unknown[];
} => {
  // The layer runs REAL from this proxy's point of view — it is not an I/O boundary — so the
  // I/O it eventually reaches (readdir/readlink/symlink/mkdir/access) is what actually gets staged
  // here.
  const layerProxy = populateOneRootLayerBrokerProxy();
  const isAccessibleProxy = pathExistsProxy();
  // Wired to satisfy enforce-proxy-child-creation and left unstaged: this proxy computes every
  // per-package node_modules path via template literals instead of calling the real broker, and
  // its own pathJoinAdapter default is a real passthrough anyway, so nothing here needs staging.
  locationsNodeModulesPathFindBrokerProxy();

  const stageWorkspaceLink = ({
    repoRoot,
    worktreePath,
    packageName,
  }: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packageName: string;
  }): void => {
    const relativeTarget = `../../packages/${packageName}`;

    layerProxy.setupTargetReady({ targetRoot: worktreePath, scopeNames: ['@dungeonmaster'] });
    layerProxy.setupDirectoryEntries({
      dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules` }),
      entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
    });
    layerProxy.setupDirectoryEntries({
      dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules/@dungeonmaster` }),
      entries: [{ name: packageName, isDir: false, isSymlink: true }],
    });
    layerProxy.setupReadlinkTarget({
      linkPath: `${repoRoot}/node_modules/@dungeonmaster/${packageName}`,
      target: relativeTarget,
    });
    layerProxy.setupSymlinkSucceeds({
      target: relativeTarget,
      path: `${worktreePath}/node_modules/@dungeonmaster/${packageName}`,
    });
  };

  return {
    setupMkdirThrows: ({ filepath, error }: { filepath: string; error: FsError }): void => {
      layerProxy.setupMkdirThrows({ filepath, error });
    },

    // A repo root whose node_modules holds no entries at all — the shape a repo with nothing
    // installed yet presents.
    setupEmptyRepo: ({ repoRoot, worktreePath }): void => {
      layerProxy.setupTargetReady({ targetRoot: worktreePath });
      layerProxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules` }),
        entries: [],
      });
    },

    setupNoWorkspaceLinks: ({ repoRoot, worktreePath, thirdPartyEntry }): void => {
      layerProxy.setupTargetReady({ targetRoot: worktreePath });
      layerProxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules` }),
        entries: [{ name: thirdPartyEntry, isDir: true, isSymlink: false }],
      });
      // A third-party entry is HARDLINKED, not linked at the source copy, so what the test stages
      // is the `cp -al` invocation rather than a symlink.
      layerProxy.setupCopySucceeds();
    },

    setupWorkspacePackageWithNodeModules: ({
      repoRoot,
      worktreePath,
      packageName,
      thirdPartyEntry,
    }): void => {
      stageWorkspaceLink({ repoRoot, worktreePath, packageName });

      const packageNodeModules = `${repoRoot}/packages/${packageName}/node_modules`;
      isAccessibleProxy.present({ path: packageNodeModules });

      layerProxy.setupTargetReady({
        targetRoot: AbsoluteFilePathStub({ value: `${worktreePath}/packages/${packageName}` }),
      });
      layerProxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({
          value: `${repoRoot}/packages/${packageName}/node_modules`,
        }),
        entries: [{ name: thirdPartyEntry, isDir: true, isSymlink: false }],
      });
      layerProxy.setupCopySucceeds();
    },

    setupWorkspacePackageWithoutNodeModules: ({ repoRoot, worktreePath, packageName }): void => {
      stageWorkspaceLink({ repoRoot, worktreePath, packageName });

      isAccessibleProxy.missing({ path: `${repoRoot}/packages/${packageName}/node_modules` });
    },

    setupWorkspacePackagePopulationRejects: ({
      repoRoot,
      worktreePath,
      packageName,
      error,
    }): void => {
      stageWorkspaceLink({ repoRoot, worktreePath, packageName });

      const packageNodeModules = `${repoRoot}/packages/${packageName}/node_modules`;
      isAccessibleProxy.present({ path: packageNodeModules });

      layerProxy.setupMkdirThrows({
        filepath: `${worktreePath}/packages/${packageName}/node_modules`,
        error,
      });
    },

    // The worktree's OWN root node_modules is already mirrored — the shape a `pt N` attempt finds
    // after an earlier attempt got the root done and died partway through the packages.
    setupRootTargetAlreadyPopulated: ({
      worktreePath,
    }: {
      worktreePath: AbsoluteFilePath;
    }): void => {
      layerProxy.setupTargetNodeModulesOnDisk({
        targetRoot: worktreePath,
        entries: [
          { name: 'zod', isDir: false, isSymlink: true },
          { name: '@dungeonmaster', isDir: true, isSymlink: false },
        ],
      });
    },

    // One workspace package inside the worktree is already mirrored while its siblings are not —
    // including the case where a spiritmender npm-installed it by hand between attempts.
    setupPackageTargetAlreadyPopulated: ({
      worktreePath,
      packageName,
    }: {
      worktreePath: AbsoluteFilePath;
      packageName: string;
    }): void => {
      layerProxy.setupTargetNodeModulesOnDisk({
        targetRoot: AbsoluteFilePathStub({ value: `${worktreePath}/packages/${packageName}` }),
        entries: [{ name: 'react-router-dom', isDir: false, isSymlink: true }],
      });
    },

    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      layerProxy.getAllSymlinks(),

    getAllCopyArgs: (): readonly unknown[] => layerProxy.getAllCopyArgs(),
  };
};
