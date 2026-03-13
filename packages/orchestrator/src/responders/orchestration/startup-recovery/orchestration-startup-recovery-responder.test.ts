import { QuestStub, QuestIdStub, DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { OrchestrationStartupRecoveryResponderProxy } from './orchestration-startup-recovery-responder.proxy';

describe('OrchestrationStartupRecoveryResponder', () => {
  describe('quest recovery', () => {
    it('VALID: {quest with in_progress status} => registers process and returns quest id', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const questId = QuestIdStub({ value: 'active-quest' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [
          DependencyStepStub({ status: 'complete' }),
          DependencyStepStub({ status: 'in_progress' }),
        ],
      });

      const result = proxy.callResponder({ quests: [quest] });

      expect(result).toStrictEqual(['active-quest']);
    });

    it('VALID: {quest with blocked status} => registers process and returns quest id', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const questId = QuestIdStub({ value: 'blocked-quest' });
      const quest = QuestStub({ id: questId, status: 'blocked' });

      const result = proxy.callResponder({ quests: [quest] });

      expect(result).toStrictEqual(['blocked-quest']);
    });

    it('VALID: {quest with approved status} => skips non-recoverable quest', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const quest = QuestStub({ status: 'approved' });

      const result = proxy.callResponder({ quests: [quest] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {quest with complete status} => skips completed quest', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const quest = QuestStub({ status: 'complete' });

      const result = proxy.callResponder({ quests: [quest] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {quest with created status} => skips created quest', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const quest = QuestStub({ status: 'created' });

      const result = proxy.callResponder({ quests: [quest] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no quests} => returns empty array', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();

      const result = proxy.callResponder({ quests: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('state registration', () => {
    it('VALID: {in_progress quest with mixed steps} => registers process with correct quest id', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const questId = QuestIdStub({ value: 'progress-quest' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [
          DependencyStepStub({ status: 'complete' }),
          DependencyStepStub({ status: 'complete' }),
          DependencyStepStub({ status: 'in_progress' }),
        ],
      });

      proxy.callResponder({ quests: [quest] });

      const processIds = orchestrationProcessesState.getAll();

      expect(processIds).toStrictEqual(['proc-f47ac10b-58cc-4372-a567-0e02b2c3d479']);

      const process = orchestrationProcessesState.get({
        processId: processIds[0]!,
      });

      expect(process?.questId).toBe('progress-quest');
    });
  });

  describe('mixed quest statuses', () => {
    it('VALID: {mix of recoverable and non-recoverable quests} => only recovers active quests', () => {
      const proxy = OrchestrationStartupRecoveryResponderProxy();
      const activeQuest = QuestStub({
        id: QuestIdStub({ value: 'active-quest' }),
        status: 'in_progress',
      });
      const completedQuest = QuestStub({
        id: QuestIdStub({ value: 'done-quest' }),
        status: 'complete',
      });
      const blockedQuest = QuestStub({
        id: QuestIdStub({ value: 'stuck-quest' }),
        status: 'blocked',
      });
      const createdQuest = QuestStub({
        id: QuestIdStub({ value: 'new-quest' }),
        status: 'created',
      });

      const result = proxy.callResponder({
        quests: [activeQuest, completedQuest, blockedQuest, createdQuest],
      });

      expect(result).toStrictEqual(['active-quest', 'stuck-quest']);
    });
  });
});
