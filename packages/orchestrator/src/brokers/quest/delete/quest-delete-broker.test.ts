import { FilePathStub, GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questDeleteBroker } from './quest-delete-broker';
import { questDeleteBrokerProxy } from './quest-delete-broker.proxy';

describe('questDeleteBroker', () => {
  describe('successful delete', () => {
    it('VALID: {questId, guildId} => removes quest folder recursively with force and returns success', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${questId}`,
      });
      const proxy = questDeleteBrokerProxy();
      proxy.setupQuestFolderPath({ homePath, guildId, questId, questFolderPath });

      const result = await questDeleteBroker({ questId, guildId });

      expect(result).toStrictEqual({ success: true });

      const rmCalls = proxy.getRmCallArgs();

      expect(rmCalls).toStrictEqual([[questFolderPath, { recursive: true, force: true }]]);
    });

    it('VALID: {questId, guildId, missing directory} => idempotent: force ignores ENOENT and still appends outbox', async () => {
      const questId = QuestIdStub({ value: 'already-gone' });
      const guildId = GuildIdStub({ value: 'e4a1c2fd-8bcf-83b0-ba4b-1818d51fc09c' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${questId}`,
      });
      const proxy = questDeleteBrokerProxy();
      proxy.setupQuestFolderPath({ homePath, guildId, questId, questFolderPath });

      const result = await questDeleteBroker({ questId, guildId });

      expect(result).toStrictEqual({ success: true });

      const appended = proxy.getAppendedContent();

      expect(appended).toStrictEqual(
        `${JSON.stringify({ questId, timestamp: '2024-01-15T10:00:00.000Z' })}\n`,
      );
    });

    it('VALID: {questId, guildId} => appends quest-modified event via outbox with questId payload', async () => {
      const questId = QuestIdStub({ value: 'emit-event' });
      const guildId = GuildIdStub({ value: '9febc069-b4e3-2f38-bd80-34df765c3b3e' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${questId}`,
      });
      const proxy = questDeleteBrokerProxy();
      proxy.setupQuestFolderPath({ homePath, guildId, questId, questFolderPath });

      await questDeleteBroker({ questId, guildId });

      const appended = proxy.getAppendedContent();

      expect(appended).toStrictEqual(
        `${JSON.stringify({ questId, timestamp: '2024-01-15T10:00:00.000Z' })}\n`,
      );
    });

    it('VALID: {two quests deleted} => getAllRmCallArgs reads back both folder removals in call order', async () => {
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const firstId = QuestIdStub({ value: 'quest-a' });
      const secondId = QuestIdStub({ value: 'quest-b' });
      const firstFolder = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${firstId}`,
      });
      const secondFolder = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${secondId}`,
      });
      const proxy = questDeleteBrokerProxy();
      proxy.setupQuestFolderPath({
        homePath,
        guildId,
        questId: firstId,
        questFolderPath: firstFolder,
      });
      proxy.setupQuestFolderPath({
        homePath,
        guildId,
        questId: secondId,
        questFolderPath: secondFolder,
      });

      await questDeleteBroker({ questId: secondId, guildId });
      await questDeleteBroker({ questId: firstId, guildId });

      expect(proxy.getAllRmCallArgs()).toStrictEqual([
        [secondFolder, { recursive: true, force: true }],
        [firstFolder, { recursive: true, force: true }],
      ]);
    });
  });
});
