/**
 * PURPOSE: Proxy for repoScopeResolveBroker — stages the fs walk raw-import-ban,
 * gateway-import-boundary and bin-program-spawn-ban all share for their default `scope`.
 *
 * USAGE:
 * const proxy = repoScopeResolveBrokerProxy();
 * proxy.setupWorkspaceRoot({ dirPath, packageJson: { name: '@acme/app', workspaces: ['packages/*'] } });
 */
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const repoScopeResolveBrokerProxy = (): {
  setupWorkspaceRoot: (args: { dirPath: string; packageJson: Record<string, unknown> }) => void;
  setupNonRootPackageJson: (args: {
    dirPath: string;
    packageJson: Record<string, unknown>;
  }) => void;
  setupNoPackageJson: (args: { dirPath: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();

  return {
    setupWorkspaceRoot: ({
      dirPath,
      packageJson,
    }: {
      dirPath: string;
      packageJson: Record<string, unknown>;
    }): void => {
      const packageJsonPath = `${dirPath}/package.json`;
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify(packageJson),
      });
    },

    setupNonRootPackageJson: ({
      dirPath,
      packageJson,
    }: {
      dirPath: string;
      packageJson: Record<string, unknown>;
    }): void => {
      const packageJsonPath = `${dirPath}/package.json`;
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify(packageJson),
      });
    },

    setupNoPackageJson: ({ dirPath }: { dirPath: string }): void => {
      const packageJsonPath = `${dirPath}/package.json`;
      existsProxy.returns({ path: packageJsonPath, exists: false });
    },
  };
};
