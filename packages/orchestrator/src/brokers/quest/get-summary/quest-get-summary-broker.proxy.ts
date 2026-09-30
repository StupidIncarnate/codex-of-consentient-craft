/**
 * PURPOSE: Proxy for quest-get-summary-broker that mocks quest find and quest load operations
 *
 * USAGE:
 * const proxy = questGetSummaryBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupQuestNotFound();
 */

import { join } from '#gateway/node/path';

import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questGetSummaryBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
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
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      // questGetSummaryBroker's own join(questPath, quest.json) -> questFilePath, addressed by
      // the exact tuple rather than an address-less FIFO slot, so it can never answer a
      // different broker's join call sharing the same underlying mocked `join`.
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
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
  };
};
