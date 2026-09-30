import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';

export const locationsRegistryLockPathFindBrokerProxy = (): {
  setupRegistryLockPath: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    registryLockPath: string;
  }) => void;
  // Forwards to locationsRootPathFindBrokerProxy's own addressed-only stage — see its header
  // comment for why a caller composed alongside another real-path.join-making resolver needs this
  // instead of setupRegistryLockPath.
  setupHomeOnly: (params: { homeDir: string; homePath: string }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle rootPathProxy's own constructor registers —
  // addressed here on this file's OWN exact tuple, so it never depends on call order relative to
  // any sibling resolver's own join call.
  const joinHandle = registerMock({ fn: join });

  return {
    setupRegistryLockPath: ({
      homeDir,
      homePath,
      rootPath,
      registryLockPath,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      registryLockPath: string;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      joinHandle
        .calledWith([rootPath, locationsStatics.siegelense.registryLock])
        .returns(registryLockPath);
    },

    setupHomeOnly: (params: { homeDir: string; homePath: string }): void => {
      rootPathProxy.setupHomeOnly(params);
    },
  };
};
