import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';

import { gatewayNpmSyncBrokerProxy } from '../../../brokers/gateway/npm-sync/gateway-npm-sync-broker.proxy';

export const CliGatewaySyncResponderProxy = (): {
  setupRepoRootAtStart: (params: { startPath: string }) => void;
  setupRepoRootInParent: (params: { startPath: string; repoRoot: string }) => void;
  setupRepoRootNotFound: (params: { startPath: string }) => void;
  setupNoGateway: (params: { repoRoot: string }) => void;
  setupSync: (params: {
    repoRoot: string;
    npmCommand: string;
    rootPackageJson: Record<string, unknown>;
    consumerFolders: readonly string[];
    ownFolders: Readonly<Record<string, Readonly<Record<string, string>>>>;
    passthroughFolders: readonly string[];
  }) => void;
  setupInstallFails: (params: { repoRoot: string; output: string }) => void;
  setupLifecycleEvent: (params: { value: string | undefined }) => void;
  getOutput: () => string;
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  const syncProxy = gatewayNpmSyncBrokerProxy();
  const stdout = stdoutProxy();
  const envProxy = getEnvProxy();

  return {
    setupRepoRootAtStart: ({ startPath }): void => {
      cwdProxy.setupRepoRootFoundAtStart({ startPath });
    },

    setupRepoRootInParent: ({ startPath, repoRoot }): void => {
      cwdProxy.setupRepoRootFoundInParent({ startPath, repoRoot });
    },

    setupRepoRootNotFound: ({ startPath }): void => {
      cwdProxy.setupRepoRootNotFound({ startPath });
    },

    setupNoGateway: ({ repoRoot }): void => {
      syncProxy.setupNoGateway({ repoRoot });
    },

    setupSync: ({
      repoRoot,
      npmCommand,
      rootPackageJson,
      consumerFolders,
      ownFolders,
      passthroughFolders,
    }): void => {
      syncProxy.setupSync({
        repoRoot,
        npmCommand,
        rootPackageJson,
        consumerFolders,
        ownFolders,
        gatewayPackageJson: { name: '@acme/npm' },
        passthroughFolders,
      });
    },

    setupInstallFails: ({ repoRoot, output }): void => {
      syncProxy.setupInstallFails({ repoRoot, output });
    },

    setupLifecycleEvent: ({ value }): void => {
      envProxy.setupEnv({ name: 'npm_lifecycle_event', value });
    },

    getOutput: (): string => stdout.getWrittenText(),
  };
};
