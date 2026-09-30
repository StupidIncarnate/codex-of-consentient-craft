import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { resolveWorkspaceGlobLayerBrokerProxy } from './resolve-workspace-glob-layer-broker.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const configWorkspacePackageNamesBrokerProxy = (): {
  setupWorkspaceRoot: (args: { rootDir: string; rootPackageJsonName: string }) => void;
  setupNoPackageJson: (args: { dir: string }) => void;
  setupGlobDirectories: (args: { basePath: string; dirNames: string[] }) => void;
  setupMemberPackageJson: (args: { memberDir: string; name: string }) => void;
} => {
  const workspaceRootProxy = workspaceRootFindBrokerProxy();
  const globProxy = resolveWorkspaceGlobLayerBrokerProxy();
  // The broker re-reads the root's own package.json directly (for the `workspaces` field
  // workspaceRootFindBroker does not return); `workspaceRootProxy.setupWorkspaceRoot` already
  // stages that exact path on the shared registerMock handle, so this child proxy exists only to
  // satisfy enforce-proxy-child-creation — nothing here is interacted with directly.
  readFileSyncProxy();

  return {
    setupWorkspaceRoot: ({
      rootDir,
      rootPackageJsonName,
    }: {
      rootDir: string;
      rootPackageJsonName: string;
    }): void => {
      workspaceRootProxy.setupWorkspaceRoot({ rootDir, rootPackageJsonName, packageNames: [] });
    },

    // existsSyncProxy (composed inside workspaceRootFindBrokerProxy) ships no address-less
    // catch-all: every ancestor level between startDir and the real workspace root needs an
    // explicit false stage too.
    setupNoPackageJson: ({ dir }: { dir: string }): void => {
      workspaceRootProxy.setupNoPackageJson({ dir });
    },

    setupGlobDirectories: ({
      basePath,
      dirNames,
    }: {
      basePath: string;
      dirNames: string[];
    }): void => {
      globProxy.setupGlobDirectories({ basePath, dirNames });
    },

    setupMemberPackageJson: ({
      memberDir,
      name,
    }: {
      memberDir: string;
      name: string;
    }): void => {
      globProxy.setupMemberPackageJson({ memberDir, name });
    },
  };
};
