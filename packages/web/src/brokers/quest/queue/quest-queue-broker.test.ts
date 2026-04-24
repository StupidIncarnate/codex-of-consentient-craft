import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { questQueueBroker } from './quest-queue-broker';
import { questQueueBrokerProxy } from './quest-queue-broker.proxy';

describe('questQueueBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {} => returns queue entries from API', async () => {
      const proxy = questQueueBrokerProxy();
      const entries = [
        QuestQueueEntryStub({ questId: 'quest-1', questTitle: 'First' }),
        QuestQueueEntryStub({ questId: 'quest-2', questTitle: 'Second' }),
      ];

      proxy.setupEntries({ entries });

      const result = await questQueueBroker();

      expect(result).toStrictEqual(entries);
    });
  });

  describe('empty queue', () => {
    it('EMPTY: {} => returns empty array', async () => {
      const proxy = questQueueBrokerProxy();

      proxy.setupEntries({ entries: [] });

      const result = await questQueueBroker();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = questQueueBrokerProxy();

      proxy.setupError();

      await expect(questQueueBroker()).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = questQueueBrokerProxy();

      proxy.setupInvalidResponse({ data: { entries: [{ bad: 'data' }] } });

      await expect(questQueueBroker()).rejects.toThrow(/invalid_type/u);
    });
  });
});
