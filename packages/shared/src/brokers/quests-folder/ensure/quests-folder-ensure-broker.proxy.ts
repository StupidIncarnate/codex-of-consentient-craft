/**
 * PURPOSE: Proxy for questsFolderEnsureBroker that composes find broker and mkdir adapter proxies
 *
 * USAGE:
 * const proxy = questsFolderEnsureBrokerProxy();
 * proxy.setupQuestsFolderEnsureSuccess({ startPath, projectRootPath, questsFolderPath });
 */

import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import type { FsError } from '#gateway/node/fs';
import { questsFolderFindBrokerProxy } from '../find/quests-folder-find-broker.proxy';

export const questsFolderEnsureBrokerProxy = (): {
  setupQuestsFolderEnsureSuccess: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: string;
  }) => void;
  setupQuestsFolderMkdirFails: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: string;
    error: FsError;
  }) => void;
} => {
  const findProxy = questsFolderFindBrokerProxy();
  const ensureDirHandle = ensureDirProxy();

  return {
    setupQuestsFolderEnsureSuccess: ({
      startPath,
      projectRootPath,
      questsFolderPath,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: string;
    }): void => {
      findProxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
      ensureDirHandle.succeeds({ path: questsFolderPath });
    },
    setupQuestsFolderMkdirFails: ({
      startPath,
      projectRootPath,
      questsFolderPath,
      error,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: string;
      error: FsError;
    }): void => {
      findProxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
      ensureDirHandle.rejects({ path: questsFolderPath, error });
    },
  };
};
