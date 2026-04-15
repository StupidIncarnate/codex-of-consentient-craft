import {
  FlowStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';
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
        questId: 'add-auth',
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

  describe('resume from paused with work items', () => {
    it('VALID: {paused quest with pending items, status→in_progress} => registers orchestration process', async () => {
      const ps1Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000002' });
      const cw2Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000003' });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        workItems: [
          WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [ps1Id] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [ps1Id] }),
        ],
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
      expect(registeredProcess?.processId).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {paused quest with mixed complete/failed/pending, status→in_progress} => registers orchestration process', async () => {
      const ps1Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000001' });
      const cw1Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000002' });
      const cw2Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000003' });
      const lb1Id = QuestWorkItemIdStub({ value: '00000000-0000-0000-0000-000000000004' });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        workItems: [
          WorkItemStub({ id: ps1Id, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [ps1Id] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [ps1Id] }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [cw1Id] }),
        ],
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
        questId: 'add-auth',
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
        questId: 'add-auth',
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess?.questId).toBe('add-auth');
      expect(registeredProcess?.processId).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {in_progress quest, status→paused} => does NOT register orchestration process', async () => {
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
        questId: 'add-auth',
        input,
      });

      expect(result.success).toBe(true);

      const registeredProcess = orchestrationProcessesState.findByQuestId({
        questId: 'add-auth' as ReturnType<typeof QuestStub>['id'],
      });

      expect(registeredProcess).toBe(undefined);
    });
  });
});
