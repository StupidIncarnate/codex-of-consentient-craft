import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsRegistryLockPathFindBrokerProxy = (): {
  setupRegistryLockPath: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    registryLockPath: FilePath;
  }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupRegistryLockPath: ({
      homeDir,
      homePath,
      rootPath,
      registryLockPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      registryLockPath: FilePath;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      pathJoinProxy.returns({ result: registryLockPath });
    },
  };
};
