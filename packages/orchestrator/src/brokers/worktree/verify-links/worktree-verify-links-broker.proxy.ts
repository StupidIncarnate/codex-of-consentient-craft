import { locationsNodeModulesPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  FilePathStub,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { walkSymlinksLayerBrokerProxy } from './walk-symlinks-layer-broker.proxy';

export const worktreeVerifyLinksBrokerProxy = (): {
  setupNodeModulesAbsent: () => void;
  setupNodeModulesPresent: (params: { worktreePath: AbsoluteFilePath }) => void;
  setupDirectoryEntries: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupReadlinkTarget: (params: { linkPath: FilePath; target: string }) => void;
} => {
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // "Nothing is there" is the honest default for a tree nobody described; a worktree described by
  // setupNodeModulesPresent below outranks this catch-all.
  isAccessibleProxy.defaultsToNotFound();
  const walkProxy = walkSymlinksLayerBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: it stages nothing of its
  // own, so every node_modules path a test stages must match Node's real path.join output.
  locationsNodeModulesPathFindBrokerProxy();

  return {
    setupNodeModulesAbsent: (): void => {
      isAccessibleProxy.defaultsToNotFound();
    },

    setupNodeModulesPresent: ({ worktreePath }: { worktreePath: AbsoluteFilePath }): void => {
      isAccessibleProxy.resolves({
        filePath: FilePathStub({ value: `${String(worktreePath)}/node_modules` }),
      });
    },

    setupDirectoryEntries: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      walkProxy.setupDirectoryEntries({ dirPath, entries });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      walkProxy.setupReadlinkTarget({ linkPath, target });
    },
  };
};
