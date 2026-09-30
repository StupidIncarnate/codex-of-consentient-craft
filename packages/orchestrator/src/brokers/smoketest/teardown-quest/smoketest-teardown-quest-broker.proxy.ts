import type { FsError } from '#gateway/node/fs';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import type { Guild } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const smoketestTeardownQuestBrokerProxy = (): {
  setupQuestFound: (params: {
    questPath: string;
    guildId: Guild['id'];
    questId: Quest['id'];
  }) => void;
  setupQuestNotFound: () => void;
  setupRmFailure: (params: { error: FsError }) => void;
  getRmCallArgs: () => readonly unknown[][];
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const removeProxy = rmProxy();
  const questFolderPathRef: { value: string } = { value: '/unset' };

  return {
    setupQuestFound: ({
      questPath,
      guildId,
      questId,
    }: {
      questPath: string;
      guildId: Guild['id'];
      questId: Quest['id'];
    }): void => {
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = String(questPath);
      const questFilePath = `${questPath}/quest.json`;
      const quest: Quest = QuestStub({ id: questId });

      questFolderPathRef.value = questFolderPath;

      findProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: JSON.stringify(quest),
              },
            ],
          },
        ],
      });

      removeProxy.succeeds({ path: questFolderPath });
    },

    setupQuestNotFound: (): void => {
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      findProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },

    setupRmFailure: ({ error }: { error: FsError }): void => {
      removeProxy.rejects({ path: questFolderPathRef.value, error });
    },

    getRmCallArgs: (): readonly unknown[][] =>
      removeProxy.getCallsFor({ path: questFolderPathRef.value }),
  };
};
