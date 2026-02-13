import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questDetailBroker } from './quest-detail-broker';
import { questDetailBrokerProxy } from './quest-detail-broker.proxy';

describe('questDetailBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {questId} => returns quest from API', async () => {
      const proxy = questDetailBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: 'add-auth', title: 'Add Auth' });

      proxy.setupQuest({ quest });

      const result = await questDetailBroker({ questId });

      expect(result).toStrictEqual(quest);
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid questId} => throws error', async () => {
      const proxy = questDetailBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupError();

      await expect(questDetailBroker({ questId })).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = questDetailBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupInvalidResponse({ data: { bad: 'data' } });

      await expect(questDetailBroker({ questId })).rejects.toThrow(/invalid_type/u);
    });
  });
});
