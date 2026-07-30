import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { OrchestrationResumeResponderProxy } from './orchestration-resume-responder.proxy';

describe('OrchestrationResumeResponder', () => {
  describe('successful resume', () => {
    it('VALID: {paused quest with pausedAtStatus explore_observables} => restores status to explore_observables', async () => {
      const questId = QuestIdStub({ value: 'resume-to-observables' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'explore_observables',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'explore_observables' });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('explore_observables');
    });

    it('VALID: {paused quest with pausedAtStatus in_progress} => restores status to in_progress', async () => {
      const questId = QuestIdStub({ value: 'resume-to-ip' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'in_progress' });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('in_progress');
    });

    it('VALID: {paused quest with pausedAtStatus explore_flows} => restores status to explore_flows', async () => {
      const questId = QuestIdStub({ value: 'resume-to-flows' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'explore_flows',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'explore_flows' });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('explore_flows');
    });
  });

  describe('quest-resumed event emission on resume', () => {
    it('VALID: {paused quest resumed successfully} => emits exactly one quest-resumed event on orchestrationEventsState announcing the resume', async () => {
      const questId = QuestIdStub({ value: 'resume-emits-event' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const emittedQuestIds = proxy
        .getEmittedResumeEvents()
        .map((emit) => String(emit.payload.questId));

      expect(emittedQuestIds).toStrictEqual([String(questId)]);
    });
  });

  describe('resuming a blocked quest', () => {
    it('VALID: {blocked quest, no pausedAtStatus snapshot} => restores status to in_progress', async () => {
      const questId = QuestIdStub({ value: 'resume-blocked' });
      const quest = QuestStub({ id: questId, status: 'blocked' });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'in_progress' });
      expect(proxy.getLastPersistedQuest().status).toBe('in_progress');
    });

    it('VALID: {blocked quest whose failed item is at the reset budget} => rearms it to pending with retryCount 0 and the resume marker BEFORE the status flip', async () => {
      const questId = QuestIdStub({ value: 'resume-blocked-rearm' });
      const operationId = OperationItemIdStub({ value: '3c08dd53-c172-4edb-a5e9-c305fc377544' });
      const workItemId = QuestWorkItemIdStub({ value: 'f3054db6-5f14-4c79-a44e-b4ee375416e2' });
      const sessionId = SessionIdStub({ value: 'a219be5c-ef0f-4987-abea-ed45fb509bbc' });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        operations: [
          OperationItemStub({ id: operationId, role: 'siegemaster', status: 'in_progress' }),
        ],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'siegemaster',
            status: 'failed',
            retryCount: slotManagerStatics.orphanRecovery.maxResets,
            resume: true,
            sessionId,
            relatedDataItems: [`operations/${operationId}`],
          }),
        ],
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest, rearmWrites: 1 });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'in_progress' });

      // Write 0 is the rearm; the status flip only happens afterwards, so a dispatch scan can
      // never see this quest dispatchable while its exhausted item is still failed-at-budget.
      const rearmed = proxy.getPersistedQuestAt({ index: 0 });

      expect({
        status: rearmed.status,
        workItems: rearmed.workItems.map((item) => ({
          id: item.id,
          status: item.status,
          retryCount: item.retryCount,
          resume: item.resume,
          sessionId: item.sessionId,
        })),
      }).toStrictEqual({
        status: 'blocked',
        workItems: [
          {
            id: workItemId,
            status: 'pending',
            retryCount: 0,
            resume: true,
            sessionId,
          },
        ],
      });
    });

    it('VALID: {blocked quest whose only failed item owns a COMPLETE operation} => no rearm write, just the status flip', async () => {
      const questId = QuestIdStub({ value: 'resume-blocked-no-rearm' });
      const operationId = OperationItemIdStub({ value: '44444444-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'dddddddd-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        operations: [OperationItemStub({ id: operationId, role: 'ward', status: 'complete' })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'ward',
            status: 'failed',
            spawnerType: 'command',
            relatedDataItems: [`operations/${operationId}`],
          }),
        ],
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const firstWrite = proxy.getPersistedQuestAt({ index: 0 });

      expect({
        status: firstWrite.status,
        workItemStatuses: firstWrite.workItems.map((item) => item.status),
      }).toStrictEqual({ status: 'in_progress', workItemStatuses: ['failed'] });
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws Quest not found', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {quest in a non-resumable status} => throws Quest is not resumable', async () => {
      const questId = QuestIdStub({ value: 'still-running' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest is not resumable/u);
    });

    it('ERROR: {paused quest missing pausedAtStatus snapshot} => throws no pausedAtStatus snapshot', async () => {
      const questId = QuestIdStub({ value: 'no-snapshot' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/no pausedAtStatus snapshot/u);
    });

    it('ERROR: {modify broker rejects} => throws wrapped error', async () => {
      const questId = QuestIdStub({ value: 'modify-fails' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupModifyReject({ error: new Error('write denied') });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/write denied/u);
    });

    it('ERROR: {paused quest, modify fails} => throws and does NOT register recovery process', async () => {
      const questId = QuestIdStub({ value: 'modify-fails-no-launch' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupModifyReject({ error: new Error('write denied') });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/write denied/u);

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });
  });

  describe('pausedAtStatus clearing + recovery launch', () => {
    it('VALID: {paused quest} => modify persists restoredStatus and strips pausedAtStatus from record', async () => {
      const questId = QuestIdStub({ value: 'resume-clear-paused-at' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'in_progress' });

      const persistedContents = proxy.getAllPersistedContents();
      const [firstWrite] = persistedContents;
      const parsedFirst = JSON.parse(String(firstWrite)) as Record<PropertyKey, unknown>;

      expect(parsedFirst.status).toBe('in_progress');
      expect('pausedAtStatus' in parsedFirst).toBe(false);
    });

    it('VALID: {paused quest} => registers recovery process after successful modify', async () => {
      const questId = QuestIdStub({ value: 'resume-launches-loop' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });
  });
});
