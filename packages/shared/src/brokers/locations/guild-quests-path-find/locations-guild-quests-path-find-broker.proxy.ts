import { locationsGuildPathFindBrokerProxy } from '../guild-path-find/locations-guild-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
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
  const pathJoinProxy = pathJoinAdapterProxy();

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
      pathJoinProxy.returns({ result: guildQuestsPath });
    },
  };
};
