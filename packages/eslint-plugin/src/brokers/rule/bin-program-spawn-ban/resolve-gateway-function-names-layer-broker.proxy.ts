import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

export const resolveGatewayFunctionNamesLayerBrokerProxy = (): {
  setupWorkspaceBarrel: (args: { rootDir: string; barrelContent: string }) => void;
  setupMissingBarrel: (args: { rootDir: string }) => void;
  setupNoWorkspaceRoot: (args: { fileDir: string }) => void;
} => {
  const workspaceProxy = workspaceRootFindBrokerProxy();
  const readProxy = readFileSyncIfExistsProxy();

  return {
    setupWorkspaceBarrel: ({
      rootDir,
      barrelContent,
    }: {
      rootDir: string;
      barrelContent: string;
    }): void => {
      workspaceProxy.setupWorkspaceRoot({
        rootDir,
        rootPackageJsonName: '@test/monorepo',
        packageNames: ['@test/node'],
      });
      readProxy.returns({
        path: `${rootDir}/packages/@gateway/node/src/child_process/child_process.ts`,
        contents: barrelContent,
      });
    },
    setupMissingBarrel: ({ rootDir }: { rootDir: string }): void => {
      workspaceProxy.setupWorkspaceRoot({
        rootDir,
        rootPackageJsonName: '@test/monorepo',
        packageNames: ['@test/node'],
      });
      readProxy.missing({
        path: `${rootDir}/packages/@gateway/node/src/child_process/child_process.ts`,
      });
    },
    setupNoWorkspaceRoot: ({ fileDir }: { fileDir: string }): void => {
      workspaceProxy.setupNoPackageJson({ dir: fileDir });
    },
  };
};
