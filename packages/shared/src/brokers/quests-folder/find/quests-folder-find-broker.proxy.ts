import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { projectRootFindBrokerProxy } from '../../project-root/find/project-root-find-broker.proxy';
import { questsFolderStatics } from '../../../statics/quests-folder/quests-folder-statics';

export const questsFolderFindBrokerProxy = (): {
  setupQuestsFolderFound: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: string;
  }) => void;
} => {
  const projectRootProxy = projectRootFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. The shared join mock already carries
  // projectRootFindBrokerProxy's own real-passthrough default; this stage only adds the
  // (projectRootPath, questsFolderDir) tuple this broker's own join call needs.
  const joinHandle = registerMock({ fn: join });

  return {
    setupQuestsFolderFound: ({
      startPath,
      projectRootPath,
      questsFolderPath,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: string;
    }): void => {
      projectRootProxy.setupProjectRootFound({ startPath, projectRootPath });
      joinHandle
        .calledWith([projectRootPath, questsFolderStatics.paths.root])
        .returns(questsFolderPath);
    },
  };
};
