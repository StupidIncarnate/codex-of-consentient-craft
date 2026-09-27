import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { resolveWorkspaceGlobLayerBrokerProxy } from './resolve-workspace-glob-layer-broker.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

export const configWorkspacePackageNamesBrokerProxy = (): {
  setupWorkspaceRoot: (args: { rootDir: string; rootPackageJsonName: string }) => void;
  setupGlobDirectories: (args: { basePath: FilePath; dirNames: string[] }) => void;
  setupMemberPackageJson: (args: { memberDir: FilePath; name: PackageName }) => void;
} => {
  const workspaceRootProxy = workspaceRootFindBrokerProxy();
  const globProxy = resolveWorkspaceGlobLayerBrokerProxy();
  // The broker re-reads the root's own package.json directly (for the `workspaces` field
  // workspaceRootFindBroker does not return); `workspaceRootProxy.setupWorkspaceRoot` already
  // stages that exact path on the shared registerMock handle, so this child proxy exists only to
  // satisfy enforce-proxy-child-creation — nothing here is interacted with directly.
  fsReadFileSyncAdapterProxy();

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

    setupGlobDirectories: ({
      basePath,
      dirNames,
    }: {
      basePath: FilePath;
      dirNames: string[];
    }): void => {
      globProxy.setupGlobDirectories({ basePath, dirNames });
    },

    setupMemberPackageJson: ({
      memberDir,
      name,
    }: {
      memberDir: FilePath;
      name: PackageName;
    }): void => {
      globProxy.setupMemberPackageJson({ memberDir, name });
    },
  };
};
