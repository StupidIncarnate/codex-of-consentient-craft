import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { workItemStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { OrchestrationAbandonResponderProxy } from './orchestration-abandon-responder.proxy';

const WORK_ITEM_STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly (keyof typeof workItemStatusMetadataStatics.statuses)[];

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

  describe('work item state matrix - terminal stays', () => {
    const TERMINAL_WORK_ITEM_STATUSES = WORK_ITEM_STATUSES.filter(
      (s) => workItemStatusMetadataStatics.statuses[s].isTerminal,
    );

    it.each(TERMINAL_WORK_ITEM_STATUSES)(
      'VALID: {work item status: %s} => terminal item unchanged after abandon',
      async (wiStatus) => {
        const questId = QuestIdStub({ value: 'abandon-terminal-wi' });
        const wiId = QuestWorkItemIdStub({ value: 'a0000000-0000-0000-0000-000000000001' });
        const workItem = WorkItemStub({ id: wiId, role: 'codeweaver', status: wiStatus });
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [workItem],
        });
        const proxy = OrchestrationAbandonResponderProxy();
        proxy.setupQuestFound({ quest });

        await proxy.callResponder({ questId });

        const { status, workItems } = proxy.getLastPersistedQuest();

        expect(status).toBe('abandoned');
        expect(workItems).toStrictEqual([
          WorkItemStub({ id: wiId, role: 'codeweaver', status: wiStatus }),
        ]);
      },
    );
  });

  describe('work item state matrix - non-terminal skipped', () => {
    const NON_TERMINAL_WORK_ITEM_STATUSES = WORK_ITEM_STATUSES.filter(
      (s) => !workItemStatusMetadataStatics.statuses[s].isTerminal,
    );

    it.each(NON_TERMINAL_WORK_ITEM_STATUSES)(
      'VALID: {work item status: %s} => non-terminal item becomes skipped after abandon',
      async (wiStatus) => {
        const questId = QuestIdStub({ value: 'abandon-nonterminal-wi' });
        const wiId = QuestWorkItemIdStub({ value: 'a0000000-0000-0000-0000-000000000002' });
        const workItem = WorkItemStub({ id: wiId, role: 'codeweaver', status: wiStatus });
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [workItem],
        });
        const proxy = OrchestrationAbandonResponderProxy();
        proxy.setupQuestFound({ quest });

        await proxy.callResponder({ questId });

        const { status, workItems } = proxy.getLastPersistedQuest();

        expect(status).toBe('abandoned');
        expect(workItems).toStrictEqual([
          WorkItemStub({ id: wiId, role: 'codeweaver', status: 'skipped' }),
        ]);
      },
    );
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
