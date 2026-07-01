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

  describe('recency ordering', () => {
    it('VALID: {quests out of order} => returns them most-recent-first by updatedAt ?? createdAt', async () => {
      const guildId = GuildIdStub();

      // older: created early, never modified → recency key = createdAt
      const older = QuestStub({
        id: 'quest-older',
        title: 'Older',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      // newest: modified most recently → recency key = updatedAt (beats both)
      const newest = QuestStub({
        id: 'quest-newest',
        title: 'Newest',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
      });
      // middle: created latest but modified before newest → recency key = updatedAt
      const middle = QuestStub({
        id: 'quest-middle',
        title: 'Middle',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      });

      const proxy = QuestListResponderProxy();
      // Broker hands them back in a non-recency order (mirrors arbitrary readdir order).
      proxy.setupDirectList({ guildId, quests: [older, newest, middle] });

      const result = await proxy.callResponder({ guildId });

      expect(result.map((item) => item.id)).toStrictEqual([newest.id, middle.id, older.id]);
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
