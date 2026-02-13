import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { dungeonmasterHomeFindBrokerProxy } from '../find/dungeonmaster-home-find-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const dungeonmasterHomeEnsureBrokerProxy = (): {
  setupEnsureSuccess: (params: {
    homeDir: string;
    homePath: FilePath;
    projectsPath: FilePath;
  }) => void;
  setupMkdirFails: (params: { homeDir: string; homePath: FilePath; error: Error }) => void;
} => {
  const findProxy = dungeonmasterHomeFindBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupEnsureSuccess: ({
      homeDir,
      homePath,
      projectsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      projectsPath: FilePath;
    }): void => {
      findProxy.setupHomePath({ homeDir, homePath });
      mkdirProxy.succeeds({ filepath: homePath });
      pathJoinProxy.returns({ result: projectsPath });
      mkdirProxy.succeeds({ filepath: projectsPath });
    },
    setupMkdirFails: ({
      homeDir,
      homePath,
      error,
    }: {
      homeDir: string;
      homePath: FilePath;
      error: Error;
    }): void => {
      findProxy.setupHomePath({ homeDir, homePath });
      mkdirProxy.throws({ filepath: homePath, error });
    },
  };
};
