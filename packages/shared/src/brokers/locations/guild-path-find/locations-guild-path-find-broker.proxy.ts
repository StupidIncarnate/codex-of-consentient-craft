import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsGuildPathFindBrokerProxy = (): {
  setupGuildPath: (params: { homeDir: string; homePath: string; guildPath: string }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports (see dungeonmaster-home-find-broker.proxy.ts for why the
  // specifier must match exactly). The guildId segment is matched by a predicate rather than an
  // exact value: locations-guild-config-path-find, locations-guild-quests-path-find and
  // locations-quest-folder-path-find all compose this proxy several layers up without knowing
  // which guildId the test under them will ask for — pinning it here would break every one of
  // them. homePath and the guildsDir literal are still pinned exactly.
  const joinHandle = registerMock({ fn: join });

  return {
    setupGuildPath: ({
      homeDir,
      homePath,
      guildPath,
    }: {
      homeDir: string;
      homePath: string;
      guildPath: string;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([
          homePath,
          locationsStatics.dungeonmasterHome.guildsDir,
          (value: unknown): boolean => typeof value === 'string',
        ])
        .returns(guildPath);
    },
  };
};
