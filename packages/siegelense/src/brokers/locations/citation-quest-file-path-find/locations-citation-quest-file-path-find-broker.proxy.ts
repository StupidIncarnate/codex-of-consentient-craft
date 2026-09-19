import {
  locationsQuestFolderPathFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

// Delegates the whole home → guild → quests → quest-folder chain to shared's own proxy, which
// stages one `pathJoinAdapter` one-shot per step. This broker's OWN join is the step after those
// four, so it lands on `pathJoinAdapter`'s real passthrough and the quest.json suffix is genuinely
// computed rather than staged — which is what makes the assertion about the filename real.
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
  pathJoinAdapterProxy();

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
