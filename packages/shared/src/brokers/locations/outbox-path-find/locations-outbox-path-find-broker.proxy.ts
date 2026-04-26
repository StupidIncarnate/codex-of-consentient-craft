import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsOutboxPathFindBrokerProxy = (): {
  setupOutboxPath: (params: { homeDir: string; homePath: FilePath; outboxPath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupOutboxPath: ({
      homeDir,
      homePath,
      outboxPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      outboxPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: outboxPath });
    },
  };
};
