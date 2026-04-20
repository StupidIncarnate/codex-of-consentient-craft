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
  });
});
