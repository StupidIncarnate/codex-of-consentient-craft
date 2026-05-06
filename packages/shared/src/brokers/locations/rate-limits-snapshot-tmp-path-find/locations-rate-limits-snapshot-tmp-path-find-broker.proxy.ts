import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsRateLimitsSnapshotTmpPathFindBrokerProxy = (): {
  setupTmpPath: (params: { homeDir: string; homePath: FilePath; tmpPath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupTmpPath: ({
      homeDir,
      homePath,
      tmpPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      tmpPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: tmpPath });
    },
  };
};
