import { pathJoinAdapterProxy, questsFolderEnsureBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

export const questListBrokerProxy = (): {
  setupQuestsFolderFound: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: FilePath;
  }) => void;
  setupQuestDirectories: (params: { files: FileName[] }) => void;
  setupQuestFilePath: (params: { result: FilePath }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
} => {
  const questsFolderProxy = questsFolderEnsureBrokerProxy();
  const fsReaddirProxy = fsReaddirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const questLoadProxy = questLoadBrokerProxy();

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
      questsFolderProxy.setupQuestsFolderEnsureSuccess({
        startPath,
        projectRootPath,
        questsFolderPath,
      });
    },
    setupQuestDirectories: ({ files }: { files: FileName[] }): void => {
      fsReaddirProxy.returns({ files });
    },
    setupQuestFilePath: ({ result }: { result: FilePath }): void => {
      pathJoinProxy.returns({ result });
    },
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      questLoadProxy.setupQuestFile({ questJson });
    },
  };
};
