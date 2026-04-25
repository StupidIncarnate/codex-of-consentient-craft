import { pathJoinAdapterProxy, fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';

export const questCreateBrokerProxy = (): {
  setupQuestCreation: (params: {
    questsFolderPath: FilePath;
    questFolderPath: FilePath;
    questFilePath: FilePath;
  }) => void;
  setupQuestCreationFailure: (params: { questsFolderPath: FilePath; error: Error }) => void;
  getWrittenContent: () => unknown;
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const persistProxy = questPersistBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestCreation: ({
      questsFolderPath,
      questFolderPath,
      questFilePath,
    }: {
      questsFolderPath: FilePath;
      questFolderPath: FilePath;
      questFilePath: FilePath;
    }): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath,
        questsPath: questsFolderPath,
      });

      mkdirProxy.succeeds({ filepath: questsFolderPath });
      pathJoinProxy.returns({ result: questFolderPath });
      pathJoinProxy.returns({ result: questFilePath });
      mkdirProxy.succeeds({ filepath: questFolderPath });

      persistProxy.setupPersist({
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    setupQuestCreationFailure: ({
      questsFolderPath,
      error,
    }: {
      questsFolderPath: FilePath;
      error: Error;
    }): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath,
        questsPath: questsFolderPath,
      });

      mkdirProxy.throws({ filepath: questsFolderPath, error });
    },

    getWrittenContent: (): unknown => persistProxy.getWrittenContent(),
  };
};
