import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsGuildPathFindBrokerProxy = (): {
  setupGuildPath: (params: { homeDir: string; homePath: FilePath; guildPath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupGuildPath: ({
      homeDir,
      homePath,
      guildPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: guildPath });
    },
  };
};
