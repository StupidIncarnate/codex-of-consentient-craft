import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FileContentsStub, FileNameStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, GuildId, QuestStub } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const loadQuestByIdLayerBrokerProxy = (): {
  setupLoaded: (params: { questPath: AbsoluteFilePath; guildId: GuildId; quest: Quest }) => void;
  setupFindThrows: (params: { error: Error }) => void;
  setupLoadThrows: (params: {
    questPath: AbsoluteFilePath;
    guildId: GuildId;
    quest: Quest;
    error: Error;
  }) => void;
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();

  const seedFind = ({
    questPath,
    guildId,
    quest,
  }: {
    questPath: AbsoluteFilePath;
    guildId: GuildId;
    quest: Quest;
  }): void => {
    const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
    const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
    const questsDirPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
    });
    const questFolderPath = FilePathStub({ value: String(questPath) });
    const questFilePath = FilePathStub({ value: `${questPath}/quest.json` });

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
    pathJoinProxy.returns({ result: questFilePath });
  };

  return {
    setupLoaded: ({
      questPath,
      guildId,
      quest,
    }: {
      questPath: AbsoluteFilePath;
      guildId: GuildId;
      quest: Quest;
    }): void => {
      seedFind({ questPath, guildId, quest });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
    },
    setupFindThrows: ({ error }: { error: Error }): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      findProxy.setupQuestsReadError({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guildDirName: FileNameStub({ value: '11111111-1111-1111-1111-111111111111' }),
      });
      // loadProxy is seeded so that if find unexpectedly succeeds, the load
      // still surfaces a deterministic error that matches the caller's expectation.
      loadProxy.setupQuestFileReadError({ error });
    },
    setupLoadThrows: ({
      questPath,
      guildId,
      quest,
      error,
    }: {
      questPath: AbsoluteFilePath;
      guildId: GuildId;
      quest: Quest;
      error: Error;
    }): void => {
      seedFind({ questPath, guildId, quest });
      loadProxy.setupQuestFileReadError({ error });
    },
  };
};
