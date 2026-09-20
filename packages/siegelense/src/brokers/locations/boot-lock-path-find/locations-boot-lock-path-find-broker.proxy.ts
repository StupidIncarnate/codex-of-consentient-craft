import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsBootLockPathFindBrokerProxy = (): {
  setupBootLockPath: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    bootLockPath: FilePath;
  }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupBootLockPath: ({
      homeDir,
      homePath,
      rootPath,
      bootLockPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      bootLockPath: FilePath;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      pathJoinProxy.returns({ result: bootLockPath });
    },
  };
};
