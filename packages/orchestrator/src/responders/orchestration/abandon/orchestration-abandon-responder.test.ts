import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationAbandonResponderProxy } from './orchestration-abandon-responder.proxy';

describe('OrchestrationAbandonResponder', () => {
  describe('successful abandon', () => {
    it('VALID: {quest in_progress} => returns abandoned true and sets status to abandoned', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = OrchestrationAbandonResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ abandoned: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('abandoned');
    });

    it('VALID: {quest paused} => transitions to abandoned', async () => {
      const questId = QuestIdStub({ value: 'paused-to-abandoned' });
      const quest = QuestStub({ id: questId, status: 'paused' });
      const proxy = OrchestrationAbandonResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('abandoned');
    });

    it('VALID: {quest in review_flows} => transitions to abandoned (spec phase)', async () => {
      const questId = QuestIdStub({ value: 'review-flows-abandon' });
      const quest = QuestStub({ id: questId, status: 'review_flows' });
      const proxy = OrchestrationAbandonResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('abandoned');
    });

    it('VALID: {quest with running process} => kills process before abandoning', async () => {
      const questId = QuestIdStub({ value: 'abandon-kill-proc' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const kill = jest.fn();
      const proxy = OrchestrationAbandonResponderProxy();
      proxy.setupWithRunningProcess({ quest, kill });

      await proxy.callResponder({ questId });

      expect(kill).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationAbandonResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest not found/u);
    });
  });
});
