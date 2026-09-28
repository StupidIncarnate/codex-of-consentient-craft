import type { FsError } from '#gateway/node/fs';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const smoketestTeardownQuestBrokerProxy = (): {
  setupQuestFound: (params: {
    questPath: AbsoluteFilePath;
    guildId: GuildId;
    questId: QuestId;
  }) => void;
  setupQuestNotFound: () => void;
  setupRmFailure: (params: { error: FsError }) => void;
  getRmCallArgs: () => readonly unknown[][];
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const removeProxy = rmProxy();
  const questFolderPathRef: { value: FilePath } = { value: FilePathStub({ value: '/unset' }) };

  return {
    setupQuestFound: ({
      questPath,
      guildId,
      questId,
    }: {
      questPath: AbsoluteFilePath;
      guildId: GuildId;
      questId: QuestId;
    }): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({ value: String(questPath) });
      const questFilePath = FilePathStub({ value: `${questPath}/quest.json` });
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
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      removeProxy.succeeds({ path: questFolderPath });
    },

    setupQuestNotFound: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
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
