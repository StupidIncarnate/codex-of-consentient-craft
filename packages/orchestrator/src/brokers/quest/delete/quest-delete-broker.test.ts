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
      proxy.setupQuestFolderPath({ homePath, questFolderPath });

      const result = await questDeleteBroker({ questId, guildId });

      expect(result).toStrictEqual({ success: true });

      const rmCalls = proxy.getRmCallArgs();

      expect(rmCalls).toStrictEqual([[questFolderPath, { recursive: true, force: true }]]);
    });

    it('VALID: {questId, guildId, missing directory} => idempotent: force ignores ENOENT and still appends outbox', async () => {
      const questId = QuestIdStub({ value: 'already-gone' });
      const guildId = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${questId}`,
      });
      const proxy = questDeleteBrokerProxy();
      proxy.setupQuestFolderPath({ homePath, questFolderPath });

      const result = await questDeleteBroker({ questId, guildId });

      expect(result).toStrictEqual({ success: true });

      const appended = proxy.getAppendedContent();

      expect(appended).toStrictEqual(
        `${JSON.stringify({ questId, timestamp: '2024-01-15T10:00:00.000Z' })}\n`,
      );
    });

    it('VALID: {questId, guildId} => appends quest-modified event via outbox with questId payload', async () => {
      const questId = QuestIdStub({ value: 'emit-event' });
      const guildId = GuildIdStub({ value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${questId}`,
      });
      const proxy = questDeleteBrokerProxy();
      proxy.setupQuestFolderPath({ homePath, questFolderPath });

      await questDeleteBroker({ questId, guildId });

      const appended = proxy.getAppendedContent();

      expect(appended).toStrictEqual(
        `${JSON.stringify({ questId, timestamp: '2024-01-15T10:00:00.000Z' })}\n`,
      );
    });
  });
});
