/**
 * PURPOSE: Proxy for repoScopeResolveBroker — stages the fs walk raw-import-ban,
 * gateway-import-boundary and bin-program-spawn-ban all share for their default `scope`.
 *
 * USAGE:
 * const proxy = repoScopeResolveBrokerProxy();
 * proxy.setupWorkspaceRoot({ dirPath, packageJson: { name: '@acme/app', workspaces: ['packages/*'] } });
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

export const repoScopeResolveBrokerProxy = (): {
  setupWorkspaceRoot: (args: { dirPath: FilePath; packageJson: Record<string, unknown> }) => void;
  setupNonRootPackageJson: (args: {
    dirPath: FilePath;
    packageJson: Record<string, unknown>;
  }) => void;
  setupNoPackageJson: (args: { dirPath: FilePath }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();

  return {
    setupWorkspaceRoot: ({
      dirPath,
      packageJson,
    }: {
      dirPath: FilePath;
      packageJson: Record<string, unknown>;
    }): void => {
      const packageJsonPath = filePathContract.parse(`${dirPath}/package.json`);
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: fileContentsContract.parse(JSON.stringify(packageJson)),
      });
    },

    setupNonRootPackageJson: ({
      dirPath,
      packageJson,
    }: {
      dirPath: FilePath;
      packageJson: Record<string, unknown>;
    }): void => {
      const packageJsonPath = filePathContract.parse(`${dirPath}/package.json`);
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: fileContentsContract.parse(JSON.stringify(packageJson)),
      });
    },

    setupNoPackageJson: ({ dirPath }: { dirPath: FilePath }): void => {
      const packageJsonPath = filePathContract.parse(`${dirPath}/package.json`);
      existsProxy.returns({ filePath: packageJsonPath, exists: false });
    },
  };
};
