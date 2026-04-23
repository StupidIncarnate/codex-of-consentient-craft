import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const smoketestTeardownQuestBrokerProxy = (): {
  setupQuestFound: (params: {
    questPath: AbsoluteFilePath;
    guildId: GuildId;
    questId: QuestId;
  }) => void;
  setupQuestNotFound: () => void;
  setupRmFailure: (params: { error: Error }) => void;
  getRmCallArgs: () => readonly unknown[][];
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const rmProxy = fsRmAdapterProxy();

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

    setupRmFailure: ({ error }: { error: Error }): void => {
      rmProxy.throws({ error });
    },

    getRmCallArgs: (): readonly unknown[][] => rmProxy.getCallArgs(),
  };
};
