import { FilePathStub, GuildIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { QuestListResponderProxy } from './quest-list-responder.proxy';

describe('QuestListResponder', () => {
  describe('successful list', () => {
    it('VALID: {guildId} => returns list items transformed from quests', async () => {
      const guildId = GuildIdStub();
      const quest = QuestStub();
      const questsPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
      });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/001-add-auth/quest.json',
      });
      const proxy = QuestListResponderProxy();
      proxy.setupQuestsPath({ homeDir: '/home/testuser', homePath, questsPath });
      proxy.setupQuestDirectories({ files: ['001-add-auth' as never] });
      proxy.setupQuestFilePath({ result: questFilePath });
      proxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await proxy.callResponder({ guildId });

      expect(result[0]!.id).toBe(quest.id);
      expect(result[0]!.title).toBe(quest.title);
      expect(result[0]!.status).toBe(quest.status);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {guildId with no quests} => returns empty array', async () => {
      const guildId = GuildIdStub();
      const questsPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
      });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const proxy = QuestListResponderProxy();
      proxy.setupQuestsPath({ homeDir: '/home/testuser', homePath, questsPath });
      proxy.setupQuestDirectories({ files: [] });

      const result = await proxy.callResponder({ guildId });

      expect(result).toStrictEqual([]);
    });
  });
});
