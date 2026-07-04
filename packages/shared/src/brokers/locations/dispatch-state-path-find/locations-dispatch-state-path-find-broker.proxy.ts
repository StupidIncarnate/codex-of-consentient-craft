import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsDispatchStatePathFindBrokerProxy = (): {
  setupDispatchStatePath: (params: {
    homeDir: string;
    homePath: FilePath;
    dispatchStatePath: FilePath;
  }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupDispatchStatePath: ({
      homeDir,
      homePath,
      dispatchStatePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      dispatchStatePath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: dispatchStatePath });
    },
  };
};
