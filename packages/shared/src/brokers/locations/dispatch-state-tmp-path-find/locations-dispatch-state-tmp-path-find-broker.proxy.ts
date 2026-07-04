import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsDispatchStateTmpPathFindBrokerProxy = (): {
  setupDispatchStateTmpPath: (params: {
    homeDir: string;
    homePath: FilePath;
    dispatchStateTmpPath: FilePath;
  }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupDispatchStateTmpPath: ({
      homeDir,
      homePath,
      dispatchStateTmpPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      dispatchStateTmpPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: dispatchStateTmpPath });
    },
  };
};
