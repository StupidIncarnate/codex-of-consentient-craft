import { locationsNodeModulesPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { populateOneRootLayerBrokerProxy } from './populate-one-root-layer-broker.proxy';

export const worktreePopulateNodeModulesBrokerProxy = (): {
  setupMkdirThrows: (params: { filepath: FilePath; error: Error }) => void;
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
    error: Error;
  }) => void;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
} => {
  // The layer runs REAL from this proxy's point of view — it is not an I/O boundary — so the
  // I/O it eventually reaches (readdir/readlink/symlink/mkdir) is what actually gets staged here.
  const layerProxy = populateOneRootLayerBrokerProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // Wired to satisfy enforce-proxy-child-creation and left unstaged: this proxy computes every
  // per-package node_modules path via template literals instead of calling the real broker, and
  // its own pathJoinAdapter default is a real passthrough anyway, so nothing here needs staging.
  locationsNodeModulesPathFindBrokerProxy();

  const stageWorkspaceLink = ({
    repoRoot,
    packageName,
  }: {
    repoRoot: AbsoluteFilePath;
    packageName: string;
  }): void => {
    const relativeTarget = `../../packages/${packageName}`;

    layerProxy.setupDirectoryEntries({
      dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules` }),
      entries: [{ name: '@dungeonmaster', isDir: true, isSymlink: false }],
    });
    layerProxy.setupDirectoryEntries({
      dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules/@dungeonmaster` }),
      entries: [{ name: packageName, isDir: false, isSymlink: true }],
    });
    layerProxy.setupReadlinkTarget({
      linkPath: FilePathStub({ value: `${repoRoot}/node_modules/@dungeonmaster/${packageName}` }),
      target: relativeTarget,
    });
    layerProxy.setupSymlinkSucceeds({ target: FilePathStub({ value: relativeTarget }) });
  };

  return {
    setupMkdirThrows: ({ filepath, error }: { filepath: FilePath; error: Error }): void => {
      layerProxy.setupMkdirThrows({ filepath, error });
    },

    setupNoWorkspaceLinks: ({ repoRoot, thirdPartyEntry }): void => {
      layerProxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: `${repoRoot}/node_modules` }),
        entries: [{ name: thirdPartyEntry, isDir: true, isSymlink: false }],
      });
      layerProxy.setupSymlinkSucceeds({
        target: FilePathStub({ value: `${repoRoot}/node_modules/${thirdPartyEntry}` }),
      });
    },

    setupWorkspacePackageWithNodeModules: ({ repoRoot, packageName, thirdPartyEntry }): void => {
      stageWorkspaceLink({ repoRoot, packageName });

      const packageNodeModules = FilePathStub({
        value: `${repoRoot}/packages/${packageName}/node_modules`,
      });
      isAccessibleProxy.resolves({ filePath: packageNodeModules });

      layerProxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({
          value: `${repoRoot}/packages/${packageName}/node_modules`,
        }),
        entries: [{ name: thirdPartyEntry, isDir: true, isSymlink: false }],
      });
      layerProxy.setupSymlinkSucceeds({
        target: FilePathStub({
          value: `${repoRoot}/packages/${packageName}/node_modules/${thirdPartyEntry}`,
        }),
      });
    },

    setupWorkspacePackageWithoutNodeModules: ({ repoRoot, packageName }): void => {
      stageWorkspaceLink({ repoRoot, packageName });

      isAccessibleProxy.rejects({
        filePath: FilePathStub({ value: `${repoRoot}/packages/${packageName}/node_modules` }),
        error: new Error('ENOENT: no such file or directory'),
      });
    },

    setupWorkspacePackagePopulationRejects: ({
      repoRoot,
      worktreePath,
      packageName,
      error,
    }): void => {
      stageWorkspaceLink({ repoRoot, packageName });

      const packageNodeModules = FilePathStub({
        value: `${repoRoot}/packages/${packageName}/node_modules`,
      });
      isAccessibleProxy.resolves({ filePath: packageNodeModules });

      layerProxy.setupMkdirThrows({
        filepath: FilePathStub({ value: `${worktreePath}/packages/${packageName}/node_modules` }),
        error,
      });
    },

    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      layerProxy.getAllSymlinks(),
  };
};
