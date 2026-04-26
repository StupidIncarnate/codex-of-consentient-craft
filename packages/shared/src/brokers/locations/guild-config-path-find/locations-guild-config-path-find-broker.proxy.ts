import { locationsGuildPathFindBrokerProxy } from '../guild-path-find/locations-guild-path-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsGuildConfigPathFindBrokerProxy = (): {
  setupGuildConfigPath: (params: {
    homeDir: string;
    homePath: FilePath;
    guildPath: FilePath;
    guildConfigPath: FilePath;
  }) => void;
} => {
  const guildPathProxy = locationsGuildPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupGuildConfigPath: ({
      homeDir,
      homePath,
      guildPath,
      guildConfigPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildPath: FilePath;
      guildConfigPath: FilePath;
    }): void => {
      guildPathProxy.setupGuildPath({ homeDir, homePath, guildPath });
      pathJoinProxy.returns({ result: guildConfigPath });
    },
  };
};
