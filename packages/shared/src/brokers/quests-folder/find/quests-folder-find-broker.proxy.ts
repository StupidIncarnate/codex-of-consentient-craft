import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { projectRootFindBrokerProxy } from '../../project-root/find/project-root-find-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const questsFolderFindBrokerProxy = (): {
  setupQuestsFolderFound: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: FilePath;
  }) => void;
} => {
  const projectRootProxy = projectRootFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestsFolderFound: ({
      startPath,
      projectRootPath,
      questsFolderPath,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: FilePath;
    }): void => {
      projectRootProxy.setupProjectRootFound({ startPath, projectRootPath });
      pathJoinProxy.returns({ result: questsFolderPath });
    },
  };
};
