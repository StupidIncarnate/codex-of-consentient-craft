import { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { questListBroker } from './quest-list-broker';
import { questListBrokerProxy } from './quest-list-broker.proxy';

describe('questListBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {} => returns quest list from API', async () => {
      const proxy = questListBrokerProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupQuests({ quests });

      const result = await questListBroker();

      expect(result).toStrictEqual(quests);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {} => returns empty array', async () => {
      const proxy = questListBrokerProxy();

      proxy.setupQuests({ quests: [] });

      const result = await questListBroker();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = questListBrokerProxy();

      proxy.setupError({ error: new Error('Network failure') });

      await expect(questListBroker()).rejects.toThrow('Network failure');
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = questListBrokerProxy();

      proxy.setupInvalidResponse({ data: [{ bad: 'data' }] });

      await expect(questListBroker()).rejects.toThrow(/invalid_type/u);
    });
  });
});
