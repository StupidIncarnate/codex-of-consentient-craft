import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsGuildPathFindBrokerProxy } from '../guild-path-find/locations-guild-path-find-broker.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsGuildQuestsPathFindBrokerProxy = (): {
  setupGuildQuestsPath: (params: {
    homeDir: string;
    homePath: FilePath;
    guildPath: FilePath;
    guildQuestsPath: FilePath;
  }) => void;
} => {
  const guildPathProxy = locationsGuildPathFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupGuildQuestsPath: ({
      homeDir,
      homePath,
      guildPath,
      guildQuestsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildPath: FilePath;
      guildQuestsPath: FilePath;
    }): void => {
      guildPathProxy.setupGuildPath({ homeDir, homePath, guildPath });
      joinHandle.calledWith([guildPath, locationsStatics.guild.questsDir]).returns(guildQuestsPath);
    },
  };
};
