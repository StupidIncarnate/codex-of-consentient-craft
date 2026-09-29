/**
 * PURPOSE: Proxy for quest-get-qa-checklist-broker that mocks quest find and quest load operations
 *
 * USAGE:
 * const proxy = questGetQaChecklistBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupQuestNotFound();
 */

import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type FilePathValue = ReturnType<typeof FilePathStub>;

export const questGetQaChecklistBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => {
    questFolderPath: FilePathValue;
    questFilePath: FilePathValue;
  };
  setupQuestNotFound: () => void;
  getQuestFileJoinArgs: (params: {
    questFolderPath: FilePathValue;
  }) => readonly unknown[] | undefined;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();

  return {
    setupQuestFound: ({
      quest,
    }: {
      quest: Quest;
    }): { questFolderPath: FilePathValue; questFilePath: FilePathValue } => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
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

      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      return { questFolderPath, questFilePath };
    },

    setupQuestNotFound: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },

    getQuestFileJoinArgs: ({
      questFolderPath,
    }: {
      questFolderPath: FilePathValue;
    }): readonly unknown[] | undefined => joinHandle.callsMatching([questFolderPath]).at(-1),
  };
};
