/**
 * PURPOSE: Proxy for useQuestsListBinding that delegates to broker proxy
 *
 * USAGE:
 * const proxy = useQuestsListBindingProxy();
 * proxy.setupQuests({ quests });
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { questListBrokerProxy } from '../../brokers/quest/list/quest-list-broker.proxy';
import type { FileName } from '../../contracts/file-name/file-name-contract';

export const useQuestsListBindingProxy = (): {
  setupQuestsFolderFound: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: FilePath;
  }) => void;
  setupQuestDirectories: (params: { files: FileName[] }) => void;
  setupQuestFilePath: (params: { result: FilePath }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
} => {
  const brokerProxy = questListBrokerProxy();

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
      brokerProxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
    },
    setupQuestDirectories: ({ files }: { files: FileName[] }): void => {
      brokerProxy.setupQuestDirectories({ files });
    },
    setupQuestFilePath: ({ result }: { result: FilePath }): void => {
      brokerProxy.setupQuestFilePath({ result });
    },
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      brokerProxy.setupQuestFile({ questJson });
    },
  };
};
