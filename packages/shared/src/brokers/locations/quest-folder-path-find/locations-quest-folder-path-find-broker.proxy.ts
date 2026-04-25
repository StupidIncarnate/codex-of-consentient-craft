import { locationsGuildQuestsPathFindBrokerProxy } from '../guild-quests-path-find/locations-guild-quests-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsQuestFolderPathFindBrokerProxy = (): {
  setupQuestFolderPath: (params: {
    homeDir: string;
    homePath: FilePath;
    guildPath: FilePath;
    guildQuestsPath: FilePath;
    questFolderPath: FilePath;
  }) => void;
} => {
  const guildQuestsProxy = locationsGuildQuestsPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestFolderPath: ({
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
      guildQuestsProxy.setupGuildQuestsPath({ homeDir, homePath, guildPath, guildQuestsPath });
      pathJoinProxy.returns({ result: questFolderPath });
    },
  };
};
