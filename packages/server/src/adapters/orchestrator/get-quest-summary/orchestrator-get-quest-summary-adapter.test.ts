import {
  QuestIdStub,
  QuestSummaryStub,
  QuestSummaryTrackCountsStub,
  QuestSummaryFlowStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestSummaryAdapter } from './orchestrator-get-quest-summary-adapter';
import { orchestratorGetQuestSummaryAdapterProxy } from './orchestrator-get-quest-summary-adapter.proxy';

describe('orchestratorGetQuestSummaryAdapter', () => {
  describe('successful get summary', () => {
    it('VALID: {questId} => returns the quest summary the orchestrator computed', async () => {
      const proxy = orchestratorGetQuestSummaryAdapterProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const summary = QuestSummaryStub({
        questId,
        flows: [
          QuestSummaryFlowStub({
            tracks: [
              QuestSummaryTrackCountsStub({
                id: 'siegemaster',
                confirmed: 4,
                unconfirmable: 1,
                outstanding: 9,
              }),
            ],
          }),
        ],
      });
      proxy.returns({ questId, summary });

      const result = await orchestratorGetQuestSummaryAdapter({ questId });

      expect(result).toStrictEqual(summary);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with the orchestrator error', async () => {
      const proxy = orchestratorGetQuestSummaryAdapterProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });

      proxy.throws({ questId, error: new Error('Quest not found: missing-quest') });

      await expect(orchestratorGetQuestSummaryAdapter({ questId })).rejects.toThrow(
        /^Quest not found: missing-quest$/u,
      );
    });
  });
});
