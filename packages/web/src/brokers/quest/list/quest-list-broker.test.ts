import {
  GuildIdStub,
  QuestListItemStub,
  SkippedQuestFileStub,
} from '@dungeonmaster/shared/contracts';

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

      expect(result).toStrictEqual({ quests, skipped: [] });
    });
  });

  describe('skipped quest files', () => {
    it('VALID: {payload names a quest file the server could not read} => returns it alongside the quests', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'First Quest' })];
      const skipped = [SkippedQuestFileStub()];

      proxy.setupQuestsWithSkips({ quests, skipped });

      const result = await questListBroker({ guildId });

      expect(result).toStrictEqual({ quests, skipped });
    });
  });

  describe('empty list', () => {
    it('EMPTY: {guildId} => returns empty quests and empty skips', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupQuests({ quests: [] });

      const result = await questListBroker({ guildId });

      expect(result).toStrictEqual({ quests: [], skipped: [] });
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

      proxy.setupInvalidResponse({ data: { quests: [{ bad: 'data' }], skipped: [] } });

      await expect(questListBroker({ guildId })).rejects.toThrow(/invalid_type/u);
    });

    it('ERROR: {fetch returns a bare array} => throws ZodError', async () => {
      const proxy = questListBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupInvalidResponse({ data: [QuestListItemStub()] });

      await expect(questListBroker({ guildId })).rejects.toThrow(
        /Expected object, received array/u,
      );
    });
  });
});
