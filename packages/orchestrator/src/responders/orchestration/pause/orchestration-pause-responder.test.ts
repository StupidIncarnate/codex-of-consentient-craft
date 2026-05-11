import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationPauseResponderProxy } from './orchestration-pause-responder.proxy';

describe('OrchestrationPauseResponder', () => {
  describe('delegation to questPauseBroker', () => {
    it('VALID: {quest in_progress found} => calls questPauseBroker once with questId+previousStatus=in_progress and returns {paused:true}', async () => {
      const questId = QuestIdStub({ value: 'pause-delegate' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ paused: true });

      const calls = proxy.getPauseBrokerCalls();
      const capturedQuestIds = calls.map((c) => c.questId);
      const capturedPreviousStatuses = calls.map((c) => c.previousStatus);

      expect(capturedQuestIds).toStrictEqual([questId]);
      expect(capturedPreviousStatuses).toStrictEqual(['in_progress']);
    });

    it('VALID: {quest at seek_scope found} => passes previousStatus=seek_scope to broker', async () => {
      const questId = QuestIdStub({ value: 'pause-delegate-seek' });
      const quest = QuestStub({ id: questId, status: 'seek_scope' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const calls = proxy.getPauseBrokerCalls();
      const capturedPreviousStatuses = calls.map((c) => c.previousStatus);

      expect(capturedPreviousStatuses).toStrictEqual(['seek_scope']);
    });
  });

  describe('quest-paused event emission on pause', () => {
    it('VALID: {quest paused successfully} => emits exactly one quest-paused event on orchestrationEventsState', async () => {
      const questId = QuestIdStub({ value: 'pause-emits-event' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestFound({ quest });

      await proxy.callResponder({ questId });

      const emittedQuestIds = proxy
        .getEmittedPauseEvents()
        .map((emit) => String(emit.payload.questId));

      expect(emittedQuestIds).toStrictEqual([String(questId)]);
    });
  });

  describe('error cases (responder-specific behavior)', () => {
    it('ERROR: {quest not found} => throws "Quest not found"', async () => {
      const questId = QuestIdStub({ value: 'pause-missing' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {broker returns paused:false} => throws "Failed to pause quest"', async () => {
      const questId = QuestIdStub({ value: 'pause-broker-fail' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = OrchestrationPauseResponderProxy();
      proxy.setupPauseBrokerReturnsNotPaused({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to pause quest/u);
    });
  });
});
