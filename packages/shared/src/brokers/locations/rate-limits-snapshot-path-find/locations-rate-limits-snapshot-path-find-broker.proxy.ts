import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsRateLimitsSnapshotPathFindBrokerProxy = (): {
  setupSnapshotPath: (params: {
    homeDir: string;
    homePath: FilePath;
    snapshotPath: FilePath;
  }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupSnapshotPath: ({
      homeDir,
      homePath,
      snapshotPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      snapshotPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: snapshotPath });
    },
  };
};
