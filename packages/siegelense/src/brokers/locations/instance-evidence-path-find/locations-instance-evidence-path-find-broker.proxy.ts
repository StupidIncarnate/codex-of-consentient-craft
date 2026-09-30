import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';

export const locationsInstanceEvidencePathFindBrokerProxy = (): {
  setupInstanceEvidencePath: (params: {
    homeDir: string;
    homePath: string;
    rootPath: string;
    evidencePath: string;
  }) => void;
  // A caller that cannot name the final evidencePath ahead of time (guildId/instanceId are only
  // known to the code under test, not to this proxy's own constructor — see
  // siegelense-driver-responder.proxy.ts) stages just the root chain and leaves the outer join to
  // the real passthrough default, the same convention locationsRepoLinkPathFindBrokerProxy's
  // setupCwd/setupHomeOnly split follows.
  setupRootOnly: (params: { homeDir: string; homePath: string; rootPath: string }) => void;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle rootPathProxy's own constructor registers —
  // addressed here on this file's OWN exact tuples, so it never depends on call order relative to
  // any sibling resolver's own join call.
  const joinHandle = registerMock({ fn: join });

  return {
    // This method's own callers never carry `guildId`/`instanceId` (only the FINAL evidencePath),
    // so which of the broker's two join shapes will run is recovered here by slicing rootPath's
    // own known length off evidencePath — the same technique
    // locationsQuestFolderPathFindBrokerProxy (shared) uses to recover `questId` — rather than
    // widening this method's signature and updating every one of its many siegelense callers.
    setupInstanceEvidencePath: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
      evidencePath: string;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });

      const relative = evidencePath.slice(rootPath.length + 1);
      const segments = relative.split('/');
      const isGuildOwned = segments[0] === locationsStatics.siegelense.guildsDir;

      if (isGuildOwned) {
        const guildId = segments[1] ?? '';
        const instanceId = segments[3] ?? '';
        joinHandle
          .calledWith([
            rootPath,
            locationsStatics.siegelense.guildsDir,
            guildId,
            locationsStatics.siegelense.instancesDir,
            instanceId,
          ])
          .returns(evidencePath);
        return;
      }

      const instanceId = segments[2] ?? '';
      joinHandle
        .calledWith([
          rootPath,
          locationsStatics.siegelense.unownedDir,
          locationsStatics.siegelense.instancesDir,
          instanceId,
        ])
        .returns(evidencePath);
    },

    setupRootOnly: ({
      homeDir,
      homePath,
      rootPath,
    }: {
      homeDir: string;
      homePath: string;
      rootPath: string;
    }): void => {
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
    },
  };
};
