import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorFindQuestByWorkItemIdAdapter } from './orchestrator-find-quest-by-work-item-id-adapter';
import { orchestratorFindQuestByWorkItemIdAdapterProxy } from './orchestrator-find-quest-by-work-item-id-adapter.proxy';

describe('orchestratorFindQuestByWorkItemIdAdapter', () => {
  describe('successful lookup', () => {
    it('VALID: {workItemId resolves to questId} => returns the questId', async () => {
      const proxy = orchestratorFindQuestByWorkItemIdAdapterProxy();
      const questId = QuestIdStub({ value: 'q-adapter-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'aaaaaaaa-aaaa-aaaa-aaaa-200000000001',
      });

      proxy.returns({ questId });

      const result = await orchestratorFindQuestByWorkItemIdAdapter({ workItemId });

      expect(result).toBe(questId);
    });

    it('EMPTY: {workItemId not owned by any quest} => returns null', async () => {
      const proxy = orchestratorFindQuestByWorkItemIdAdapterProxy();
      const workItemId = QuestWorkItemIdStub({
        value: 'aaaaaaaa-aaaa-aaaa-aaaa-200000000002',
      });

      proxy.returns({ questId: null });

      const result = await orchestratorFindQuestByWorkItemIdAdapter({ workItemId });

      expect(result).toBe(null);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorFindQuestByWorkItemIdAdapterProxy();
      const workItemId = QuestWorkItemIdStub({
        value: 'aaaaaaaa-aaaa-aaaa-aaaa-200000000003',
      });

      proxy.throws({ error: new Error('lookup failed') });

      await expect(orchestratorFindQuestByWorkItemIdAdapter({ workItemId })).rejects.toThrow(
        /^lookup failed$/u,
      );
    });
  });
});
