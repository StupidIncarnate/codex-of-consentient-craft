import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';

export const locationsProfilesPathFindBrokerProxy = (): {
  setupProfilesPath: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    profilesPath: string;
  }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle rootPathProxy's own constructor registers —
  // addressed here on this file's OWN exact tuple, so it never depends on call order relative to
  // any sibling resolver's own join call.
  const joinHandle = registerMock({ fn: join });

  return {
    // This method's own callers never carry `specHash` (only the FINAL profilesPath), so it is
    // recovered here by slicing rootPath + profilesDir's own known length off profilesPath — the
    // same technique locationsQuestFolderPathFindBrokerProxy (shared) uses to recover `questId`.
    setupProfilesPath: ({
      homeDir,
      homePath,
      rootPath,
      profilesPath,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      profilesPath: string;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      const prefixLength = rootPath.length + 1 + locationsStatics.siegelense.profilesDir.length + 1;
      const specHash = profilesPath.slice(prefixLength);
      joinHandle
        .calledWith([rootPath, locationsStatics.siegelense.profilesDir, specHash])
        .returns(profilesPath);
    },
  };
};
