import {
  QuestIdStub,
  QuestStub,
  WorkItemStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { OrchestrationPauseResponderProxy } from './orchestration-pause-responder.proxy';

describe('OrchestrationPauseResponder', () => {
  describe('successful pause', () => {
    it('VALID: {quest in_progress with no running items} => returns paused true and sets status to blocked', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('blocked');
    });

    it('VALID: {quest with in_progress work items} => resets work items to pending', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const wiId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const workItem = WorkItemStub({
        id: wiId,
        role: 'codeweaver',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();
      const resetItem = persisted.workItems.find((wi) => wi.id === wiId);

      expect(resetItem?.status).toBe('pending');
    });

    it('VALID: {quest with running process} => kills process before pausing', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const kill = jest.fn();
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupWithRunningProcess({ quest, kill });

      await proxy.callResponder({ questId });

      expect(kill).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest not found/u);
    });
  });
});
