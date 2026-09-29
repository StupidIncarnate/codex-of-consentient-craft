import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsQuestFolderPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/quest-folder-path-find/locations-quest-folder-path-find-broker.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

// Delegates the whole home → guild → quests → quest-folder chain to shared's own proxy, which
// stages each step's own `join` call by exact tuple. This broker's OWN join is the step after
// those four, so it lands on the real passthrough default that chain's own
// dungeonmasterHomeFindBrokerProxy already registers on this same '#gateway/node/path' `join`
// reference — the quest.json suffix stays genuinely computed rather than staged, which is what
// makes the assertion about the filename real.
export const locationsCitationQuestFilePathFindBrokerProxy = (): {
  setupQuestFolder: (params: {
    homeDir: string;
    homePath: FilePath;
    guildPath: FilePath;
    guildQuestsPath: FilePath;
    questFolderPath: FilePath;
  }) => void;
} => {
  const questFolderProxy = locationsQuestFolderPathFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — constructed here only to satisfy
  // enforce-proxy-child-creation, since this broker imports `join` directly. Never staged: the
  // real passthrough default questFolderProxy's own composition chain already registers on this
  // same function reference covers it.
  registerMock({ fn: join });

  return {
    setupQuestFolder: ({
      homeDir,
      homePath,
      guildPath,
      guildQuestsPath,
      questFolderPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildPath: FilePath;
      guildQuestsPath: FilePath;
      questFolderPath: FilePath;
    }): void => {
      questFolderProxy.setupQuestFolderPath({
        homeDir,
        homePath,
        guildPath,
        guildQuestsPath,
        questFolderPath,
      });
    },
  };
};
