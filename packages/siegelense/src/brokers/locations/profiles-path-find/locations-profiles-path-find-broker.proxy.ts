import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsProfilesPathFindBrokerProxy = (): {
  setupProfilesPath: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    profilesPath: FilePath;
  }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupProfilesPath: ({
      homeDir,
      homePath,
      rootPath,
      profilesPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      profilesPath: FilePath;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      pathJoinProxy.returns({ result: profilesPath });
    },
  };
};
