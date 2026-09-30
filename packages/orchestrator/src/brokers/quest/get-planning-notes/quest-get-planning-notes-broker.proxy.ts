/**
 * PURPOSE: Proxy for quest-get-planning-notes-broker that mocks quest find and quest load operations
 *
 * USAGE:
 * const proxy = questGetPlanningNotesBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupQuestNotFound();
 */

import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type FilePathValue = string;

export const questGetPlanningNotesBrokerProxy = (): {
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
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

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
                contents: JSON.stringify(quest),
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
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';

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
