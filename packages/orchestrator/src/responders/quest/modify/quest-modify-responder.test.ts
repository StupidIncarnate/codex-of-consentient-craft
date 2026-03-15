import { FlowStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { QuestModifyResponderProxy } from './quest-modify-responder.proxy';

describe('QuestModifyResponder', () => {
  describe('failed modification', () => {
    it('ERROR: {quest not found} => returns failure result', async () => {
      const proxy = QuestModifyResponderProxy();
      proxy.setupQuestModifyEmpty();

      const input = ModifyQuestInputStub({ questId: 'nonexistent-quest' });

      const result = await proxy.callResponder({
        questId: 'nonexistent-quest',
        input,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('auto-resume after gate approval', () => {
    it('VALID: {status: flows_approved} => does not trigger orchestration loop (no longer auto-resumable)', async () => {
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'flows_approved',
      });

      const result = await proxy.callResponder({
        questId: 'add-auth',
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess).toBeUndefined();
    });

    it('VALID: {status: explore_observables} => does not trigger orchestration loop (no longer auto-resumable)', async () => {
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [FlowStub()],
      });
      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'explore_observables',
      });

      const result = await proxy.callResponder({
        questId: 'add-auth',
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess).toBeUndefined();
    });

    it('VALID: {status: in_progress from blocked} => triggers orchestration loop and registers process', async () => {
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'blocked',
      });
      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await proxy.callResponder({
        questId: 'add-auth',
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess?.questId).toBe('add-auth');
    });
  });
});
