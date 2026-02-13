import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const questResolveQuestsPathBrokerProxy = (): {
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestsPath: ({
      homeDir,
      homePath,
      questsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      questsPath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: questsPath });
    },
  };
};
