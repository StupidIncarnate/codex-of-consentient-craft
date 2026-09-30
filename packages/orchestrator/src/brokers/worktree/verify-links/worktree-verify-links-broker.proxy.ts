import { locationsNodeModulesPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/node-modules-path-find/locations-node-modules-path-find-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

import { walkSymlinksLayerBrokerProxy } from './walk-symlinks-layer-broker.proxy';

export const worktreeVerifyLinksBrokerProxy = (): {
  setupNodeModulesAbsent: (params: { worktreePath: string }) => void;
  setupNodeModulesPresent: (params: { worktreePath: string }) => void;
  setupDirectoryEntries: (params: {
    dirPath: string;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupReadlinkTarget: (params: { linkPath: string; target: string }) => void;
} => {
  const isAccessibleProxy = pathExistsProxy();
  const walkProxy = walkSymlinksLayerBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: it stages nothing of its
  // own, so every node_modules path a test stages must match Node's real path.join output.
  locationsNodeModulesPathFindBrokerProxy();

  return {
    setupNodeModulesAbsent: ({ worktreePath }: { worktreePath: string }): void => {
      isAccessibleProxy.missing({ path: `${worktreePath}/node_modules` });
    },

    setupNodeModulesPresent: ({ worktreePath }: { worktreePath: string }): void => {
      isAccessibleProxy.present({ path: `${worktreePath}/node_modules` });
    },

    setupDirectoryEntries: ({
      dirPath,
      entries,
    }: {
      dirPath: string;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      walkProxy.setupDirectoryEntries({ dirPath, entries });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: string; target: string }): void => {
      walkProxy.setupReadlinkTarget({ linkPath, target });
    },
  };
};
