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
  // Forwards to locationsRootPathFindBrokerProxy's own addressed-only stage — see its header
  // comment for why a caller composed alongside another real-path.join-making resolver needs this
  // instead of setupBootLockPath.
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
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

    setupHomeOnly: (params: { homeDir: string; homePath: FilePath }): void => {
      rootPathProxy.setupHomeOnly(params);
    },
  };
};
