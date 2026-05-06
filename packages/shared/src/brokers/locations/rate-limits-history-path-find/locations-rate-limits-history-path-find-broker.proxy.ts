import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsRateLimitsHistoryPathFindBrokerProxy = (): {
  setupHistoryPath: (params: {
    homeDir: string;
    homePath: FilePath;
    historyPath: FilePath;
  }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupHistoryPath: ({
      homeDir,
      homePath,
      historyPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      historyPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: historyPath });
    },
  };
};
