import {
  QuestIdStub,
  QuestSummaryFlowStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
} from '@dungeonmaster/shared/contracts';

import { questSummaryBroker } from './quest-summary-broker';
import { questSummaryBrokerProxy } from './quest-summary-broker.proxy';

describe('questSummaryBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {questId} => returns the parsed quest summary', async () => {
      const proxy = questSummaryBrokerProxy();
      const summary = QuestSummaryStub({
        questId: 'test-quest',
        flows: [
          QuestSummaryFlowStub({
            tracks: [
              QuestSummaryTrackCountsStub({
                id: 'siegemaster',
                confirmed: 2,
                unconfirmable: 1,
                outstanding: 9,
              }),
            ],
          }),
        ],
      });
      proxy.setupSummary({ summary });

      const result = await questSummaryBroker({ questId: QuestIdStub({ value: 'test-quest' }) });

      expect(result).toStrictEqual(summary);
    });

    it('VALID: {questId} => interpolates the questId into the path and issues exactly one GET', async () => {
      const proxy = questSummaryBrokerProxy();
      proxy.setupSummary({ summary: QuestSummaryStub({ questId: 'path-param-quest' }) });

      const result = await questSummaryBroker({
        questId: QuestIdStub({ value: 'path-param-quest' }),
      });

      expect(proxy.getRequestCount()).toBe(1);
      expect(result.questId).toBe('path-param-quest');
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {server returns 404} => throws naming the URL and status', async () => {
      const proxy = questSummaryBrokerProxy();
      proxy.setupNotFound();

      await expect(
        questSummaryBroker({ questId: QuestIdStub({ value: 'q-missing' }) }),
      ).rejects.toThrow(/^GET \/api\/quests\/q-missing\/summary failed with status 404$/u);
    });
  });
});
