import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';

export const questListBrokerProxy = (): {
  setupQuestsPath: (params: { homeDir: string; homePath: FilePath; questsPath: FilePath }) => void;
  setupQuestDirectories: (params: { files: FileName[] }) => void;
  setupQuestFilePath: (params: { result: FilePath }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const fsReaddirProxy = fsReaddirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const questLoadProxy = questLoadBrokerProxy();

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
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir,
        homePath,
        questsPath,
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
