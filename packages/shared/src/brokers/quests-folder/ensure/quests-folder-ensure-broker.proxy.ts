/**
 * PURPOSE: Proxy for questsFolderEnsureBroker that composes find broker and mkdir adapter proxies
 *
 * USAGE:
 * const proxy = questsFolderEnsureBrokerProxy();
 * proxy.setupQuestsFolderEnsureSuccess({ startPath, projectRootPath, questsFolderPath });
 */

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { questsFolderFindBrokerProxy } from '../find/quests-folder-find-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const questsFolderEnsureBrokerProxy = (): {
  setupQuestsFolderEnsureSuccess: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: FilePath;
  }) => void;
  setupQuestsFolderMkdirFails: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: FilePath;
    error: Error;
  }) => void;
} => {
  const findProxy = questsFolderFindBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();

  return {
    setupQuestsFolderEnsureSuccess: ({
      startPath,
      projectRootPath,
      questsFolderPath,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: FilePath;
    }): void => {
      findProxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
      mkdirProxy.succeeds({ filepath: questsFolderPath });
    },
    setupQuestsFolderMkdirFails: ({
      startPath,
      projectRootPath,
      questsFolderPath,
      error,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: FilePath;
      error: Error;
    }): void => {
      findProxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
      mkdirProxy.throws({ filepath: questsFolderPath, error });
    },
  };
};
