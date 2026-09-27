import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsRegistryPathFindBrokerProxy = (): {
  setupRegistryPath: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    registryPath: FilePath;
  }) => void;
  // Forwards to locationsRootPathFindBrokerProxy's own addressed-only stage — see its header
  // comment for why a caller composed alongside another real-path.join-making resolver needs this
  // instead of setupRegistryPath.
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupRegistryPath: ({
      homeDir,
      homePath,
      rootPath,
      registryPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      registryPath: FilePath;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      pathJoinProxy.returns({ result: registryPath });
    },

    setupHomeOnly: (params: { homeDir: string; homePath: FilePath }): void => {
      rootPathProxy.setupHomeOnly(params);
    },
  };
};
