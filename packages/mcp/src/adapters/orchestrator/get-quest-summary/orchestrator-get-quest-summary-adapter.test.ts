import { QuestSummaryStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorGetQuestSummaryAdapter } from './orchestrator-get-quest-summary-adapter';
import { orchestratorGetQuestSummaryAdapterProxy } from './orchestrator-get-quest-summary-adapter.proxy';

describe('orchestratorGetQuestSummaryAdapter', () => {
  describe('summary retrieval', () => {
    it('VALID: {questId} => returns the summary structure untouched', async () => {
      const proxy = orchestratorGetQuestSummaryAdapterProxy();
      const summary = QuestSummaryStub({ questId: 'add-auth' });
      proxy.returns({ questId: 'add-auth', summary });

      const result = await orchestratorGetQuestSummaryAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual(summary);
    });

    it('VALID: {questId} => forwards it to the orchestrator', async () => {
      const proxy = orchestratorGetQuestSummaryAdapterProxy();
      proxy.returns({ questId: 'add-auth', summary: QuestSummaryStub({ questId: 'add-auth' }) });

      await orchestratorGetQuestSummaryAdapter({ questId: 'add-auth' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetQuestSummaryAdapterProxy();
      proxy.throws({ questId: 'add-auth', error: new Error('Quest not found') });

      await expect(orchestratorGetQuestSummaryAdapter({ questId: 'add-auth' })).rejects.toThrow(
        /Quest not found/u,
      );
    });
  });
});
