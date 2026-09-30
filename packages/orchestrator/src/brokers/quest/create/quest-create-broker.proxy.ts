import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import type { FsError } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';

export const questCreateBrokerProxy = (): {
  setupQuestCreation: (params: {
    questsFolderPath: string;
    questFolderPath: string;
    questFilePath: string;
  }) => void;
  setupQuestCreationFailure: (params: { questsFolderPath: string; error: Error }) => void;
  getWrittenContent: (params: { questFilePath: string }) => unknown;
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const mkdirProxy = ensureDirProxy();
  const persistProxy = questPersistBrokerProxy();
  const joinHandle = registerMock({ fn: join });

  return {
    setupQuestCreation: ({
      questsFolderPath,
      questFolderPath,
      questFilePath,
    }: {
      questsFolderPath: string;
      questFolderPath: string;
      questFilePath: string;
    }): void => {
      const homePath = '/home/testuser/.dungeonmaster';
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath,
        questsPath: questsFolderPath,
      });

      mkdirProxy.succeeds({ path: questsFolderPath });
      const folderSegment = String(questFolderPath).split('/').filter(Boolean).pop();
      joinHandle.calledWith([questsFolderPath, folderSegment]).returns(questFolderPath);
      mkdirProxy.succeeds({ path: questFolderPath });
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      persistProxy.setupPersist({
        questFilePath,
        homePath,
        outboxFilePath: '/home/testuser/.dungeonmaster/outbox.jsonl',
      });
    },

    setupQuestCreationFailure: ({
      questsFolderPath,
      error,
    }: {
      questsFolderPath: string;
      error: Error;
    }): void => {
      const homePath = '/home/testuser/.dungeonmaster';
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath,
        questsPath: questsFolderPath,
      });

      const fsError: FsError = Object.assign(error, { code: 'EACCES' });
      mkdirProxy.rejects({ path: questsFolderPath, error: fsError });
    },

    getWrittenContent: ({ questFilePath }: { questFilePath: string }): unknown =>
      persistProxy.getWrittenContent({ questFilePath }),
  };
};
