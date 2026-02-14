import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from './quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from './quest-find-quest-path-broker.proxy';

describe('questFindQuestPathBroker', () => {
  describe('quest found', () => {
    it('VALID: {questId in single guild} => returns quest path and guild id', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result.questPath).toBe(
        `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
      );
      expect(result.guildId).toBe(guildId);
    });

    it('VALID: {questId in second guild} => returns correct guild', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest1 = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const quest2 = QuestStub({ id: 'fix-bug', folder: '001-fix-bug' });
      const guildId1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const guildId2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId1 }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId1}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId1}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId1}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest1) }),
              },
            ],
          },
          {
            dirName: FileNameStub({ value: guildId2 }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId2}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-fix-bug' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId2}/quests/001-fix-bug/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId2}/quests/001-fix-bug`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest2) }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result.questPath).toBe(
        `/home/user/.dungeonmaster/guilds/${guildId2}/quests/001-fix-bug`,
      );
      expect(result.guildId).toBe(guildId2);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {no guilds exist} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupNoGuilds({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any guild/u,
      );
    });

    it('ERROR: {questId not in any guild} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestNotFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/guilds/${guildId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/guilds/${guildId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any guild/u,
      );
    });
  });

  describe('error handling', () => {
    it('VALID: {guild with inaccessible quests dir} => skips guild and throws not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestsReadError({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guildDirName: FileNameStub({ value: guildId }),
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "add-auth" not found in any guild/u,
      );
    });
  });
});
