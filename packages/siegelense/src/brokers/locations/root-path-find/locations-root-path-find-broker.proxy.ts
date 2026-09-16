import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsRootPathFindBrokerProxy = (): {
  setupRootPath: (params: { homeDir: string; homePath: FilePath; rootPath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupRootPath: ({
      homeDir,
      homePath,
      rootPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: rootPath });
    },
  };
};
