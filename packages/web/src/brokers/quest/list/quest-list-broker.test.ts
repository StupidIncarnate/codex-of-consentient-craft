import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { questListBroker } from './quest-list-broker';
import { questListBrokerProxy } from './quest-list-broker.proxy';

describe('questListBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {guildId} => returns quest list from API', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupQuests({ quests });

      const result = await questListBroker({ guildId });

      expect(result).toStrictEqual(quests);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {guildId} => returns empty array', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupQuests({ quests: [] });

      const result = await questListBroker({ guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(questListBroker({ guildId })).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupInvalidResponse({ data: [{ bad: 'data' }] });

      await expect(questListBroker({ guildId })).rejects.toThrow(/invalid_type/u);
    });
  });
});
