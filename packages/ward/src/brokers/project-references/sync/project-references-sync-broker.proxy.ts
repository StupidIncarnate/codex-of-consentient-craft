import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { tsconfigPairWriteLayerBrokerProxy } from './tsconfig-pair-write-layer-broker.proxy';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';
import { workspaceInputBuildLayerBrokerProxy } from './workspace-input-build-layer-broker.proxy';

export const projectReferencesSyncBrokerProxy = (): {
  /**
   * Primes the I/O for one workspace folder. The broker reads this workspace's tsconfig.json
   * TWICE — once for the eligibility scan (workspaceInputBuildLayerBroker) and again to build
   * the sync pair (projectReferencesSyncBroker's own readTsconfigSafeLayerBroker call) — both
   * reads target the identical path, so one address-keyed staging answers both; there is no
   * separate "pair build" content to queue.
   */
  setupWorkspace: (params: {
    folderPath: string;
    tsconfigJson: string | null;
    packageJson: string | null;
  }) => void;
  setupRootTsconfig: (params: { rootPath: string; tsconfigJson: string | null }) => void;
  captureWrites: () => readonly { path: unknown; content: unknown }[];
} => {
  const buildProxy = workspaceInputBuildLayerBrokerProxy();
  const tsconfigProxy = readTsconfigSafeLayerBrokerProxy();
  const writeProxy = tsconfigPairWriteLayerBrokerProxy();

  return {
    setupWorkspace: ({
      folderPath,
      tsconfigJson,
      packageJson,
    }: {
      folderPath: string;
      tsconfigJson: string | null;
      packageJson: string | null;
    }): void => {
      buildProxy.setupWorkspace({ folderPath, tsconfigJson, packageJson });
      // Staged preemptively: whether this workspace's pair actually drifts (and therefore
      // gets written) is a derived outcome of the broker's own comparison, not something the
      // test dictates up front. An unconsumed staging is harmless.
      writeProxy.setupWrite({
        filePath: absoluteFilePathContract.parse(`${folderPath}/tsconfig.json`),
      });
    },

    setupRootTsconfig: ({
      rootPath,
      tsconfigJson,
    }: {
      rootPath: string;
      tsconfigJson: string | null;
    }): void => {
      const rootTsconfigPath = filePathContract.parse(`${rootPath}/tsconfig.json`);
      if (tsconfigJson === null) {
        tsconfigProxy.throws({ tsconfigPath: rootTsconfigPath, error: new Error('ENOENT') });
      } else {
        tsconfigProxy.returns({ tsconfigPath: rootTsconfigPath, content: tsconfigJson });
      }
      writeProxy.setupWrite({
        filePath: absoluteFilePathContract.parse(String(rootTsconfigPath)),
      });
    },

    captureWrites: (): readonly { path: unknown; content: unknown }[] => writeProxy.captureWrites(),
  };
};
