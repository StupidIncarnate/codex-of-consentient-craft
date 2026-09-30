import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts/modify-quest-input/modify-quest-input.stub';
import { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { QuestModifyResponderProxy } from './quest-modify-responder.proxy';

describe('QuestModifyResponder', () => {
  describe('failed modification', () => {
    it('ERROR: {quest not found} => returns failure result', async () => {
      const proxy = QuestModifyResponderProxy();
      proxy.setupQuestModifyEmpty();

      const input = ModifyQuestInputStub({ questId: 'nonexistent-quest' });

      const result = await proxy.callResponder({
        questId: QuestIdStub({ value: 'nonexistent-quest' }),
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
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess).toBe(undefined);
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
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess).toBe(undefined);
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
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess?.questId).toBe('add-auth');
    });
  });

  describe('resume from paused with work items', () => {
    it('VALID: {paused quest with pending items, status→in_progress} => registers orchestration process', async () => {
      const planId = QuestWorkItemIdStub({ value: 'c96589ee-fb08-28c0-b179-095bcd0cef5f' });
      const cw1Id = QuestWorkItemIdStub({ value: '81f426e0-1386-5542-a1f6-e46a94b91dd3' });
      const cw2Id = QuestWorkItemIdStub({ value: 'ba584060-c8f2-4b59-8ce3-f17766ba76d3' });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        workItems: [
          WorkItemStub({ id: planId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [planId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [planId] }),
        ],
      });

      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await proxy.callResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess?.questId).toBe('add-auth');
      expect(registeredProcess?.processId).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {paused quest with mixed complete/failed/pending, status→in_progress} => registers orchestration process', async () => {
      const planId = QuestWorkItemIdStub({ value: 'c96589ee-fb08-28c0-b179-095bcd0cef5f' });
      const cw1Id = QuestWorkItemIdStub({ value: '81f426e0-1386-5542-a1f6-e46a94b91dd3' });
      const cw2Id = QuestWorkItemIdStub({ value: 'ba584060-c8f2-4b59-8ce3-f17766ba76d3' });
      const scout1Id = QuestWorkItemIdStub({ value: 'f9057c2c-1e0a-8041-93c0-77bb4a16a8d2' });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        workItems: [
          WorkItemStub({ id: planId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [planId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [planId] }),
          WorkItemStub({
            id: scout1Id,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [cw1Id],
          }),
        ],
      });

      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await proxy.callResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess?.questId).toBe('add-auth');
      expect(registeredProcess?.processId).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {paused quest with existing process, status→in_progress} => does not register duplicate process', async () => {
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        workItems: [WorkItemStub({ role: 'codeweaver', status: 'pending' })],
      });

      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const existingProcess = OrchestrationProcessStub({
        processId: 'proc-existing-process' as ReturnType<
          typeof OrchestrationProcessStub
        >['processId'],
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });
      orchestrationProcessesState.register({ orchestrationProcess: existingProcess });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await proxy.callResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const allProcessIds = orchestrationProcessesState.getAll();

      expect(allProcessIds).toStrictEqual(['proc-existing-process']);
    });

    it('VALID: {paused quest with empty work items, status→in_progress} => registers orchestration process', async () => {
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        workItems: [],
      });

      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await proxy.callResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess?.questId).toBe('add-auth');
      expect(registeredProcess?.processId).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('INVALID: {in_progress quest, status→paused} => the modify route refuses the write and does NOT register orchestration process', async () => {
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        workItems: [WorkItemStub({ role: 'codeweaver', status: 'pending' })],
      });

      const proxy = QuestModifyResponderProxy();
      proxy.setupAutoResume({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'paused',
      });

      const result = await proxy.callResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        input,
      });

      // questModifyBroker refuses a bare status:'paused' write outright — pause's side effects
      // (killing registered subprocesses, resetting active work items to pending) live only behind
      // the dedicated POST /api/quests/:questId/pause route. The PATCH route this responder serves
      // is not a way to reach `paused` at all any more, so the write fails...
      expect(result.success).toBe(false);

      // ...and, consistently, no orchestration process is registered for a write that never landed.
      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess).toBe(undefined);
    });
  });
});
