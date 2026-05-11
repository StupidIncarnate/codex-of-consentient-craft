import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationResumeResponderProxy } from './orchestration-resume-responder.proxy';

describe('OrchestrationResumeResponder', () => {
  describe('successful resume', () => {
    it('VALID: {paused quest with pausedAtStatus seek_scope} => restores status to seek_scope', async () => {
      const questId = QuestIdStub({ value: 'resume-to-scope' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'seek_scope',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'seek_scope' });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('seek_scope');
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

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws Quest not found', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {quest not in paused status} => throws Quest is not paused', async () => {
      const questId = QuestIdStub({ value: 'still-running' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        pausedAtStatus: 'seek_scope',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest is not paused/u);
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
        pausedAtStatus: 'seek_scope',
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
        pausedAtStatus: 'seek_scope',
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
        pausedAtStatus: 'seek_scope',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ resumed: true, restoredStatus: 'seek_scope' });

      const persistedContents = proxy.getAllPersistedContents();
      const [firstWrite] = persistedContents;
      const parsedFirst = JSON.parse(String(firstWrite)) as Record<PropertyKey, unknown>;

      expect(parsedFirst.status).toBe('seek_scope');
      expect('pausedAtStatus' in parsedFirst).toBe(false);
    });

    it('VALID: {paused quest} => registers recovery process after successful modify', async () => {
      const questId = QuestIdStub({ value: 'resume-launches-loop' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        pausedAtStatus: 'seek_scope',
      });
      const proxy = OrchestrationResumeResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });
  });
});
