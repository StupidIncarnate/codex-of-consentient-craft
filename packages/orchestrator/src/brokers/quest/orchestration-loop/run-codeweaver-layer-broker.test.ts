import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  StepIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { runCodeweaverLayerBroker } from './run-codeweaver-layer-broker';
import { runCodeweaverLayerBrokerProxy } from './run-codeweaver-layer-broker.proxy';

const COMPLETE_SIGNAL_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        id: 'toolu_signal',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'Done' },
      },
    ],
  },
});

describe('runCodeweaverLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runCodeweaverLayerBroker).toBe('function');
    });
  });

  describe('1 codeweaver success', () => {
    it('VALID: {1 codeweaver work item, agent signals complete} => marks codeweaver complete', async () => {
      const stepId = StepIdStub({ value: 'step-aaa' });
      const step = DependencyStepStub({ id: stepId });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });
  });

  describe('2 codeweavers all success', () => {
    it('VALID: {2 codeweaver work items, agents signal complete} => marks both complete', async () => {
      const stepId1 = StepIdStub({ value: 'step-aaa' });
      const stepId2 = StepIdStub({ value: 'step-bbb' });
      const step1 = DependencyStepStub({ id: stepId1 });
      const step2 = DependencyStepStub({ id: stepId2 });

      const workItemId1 = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItemId2 = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItem1 = WorkItemStub({
        id: workItemId1,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId1)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId2)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2],
        workItems: [workItem1, workItem2],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });

      expect(status1).toBe('complete');
      expect(status2).toBe('complete');
    });
  });

  describe('3 codeweavers all success', () => {
    it('VALID: {3 codeweaver work items filling all slots, agents signal complete} => marks all 3 complete', async () => {
      const stepId1 = StepIdStub({ value: 'step-aaa' });
      const stepId2 = StepIdStub({ value: 'step-bbb' });
      const stepId3 = StepIdStub({ value: 'step-ccc' });
      const step1 = DependencyStepStub({ id: stepId1 });
      const step2 = DependencyStepStub({ id: stepId2 });
      const step3 = DependencyStepStub({ id: stepId3 });

      const workItemId1 = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItemId2 = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItemId3 = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem1 = WorkItemStub({
        id: workItemId1,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId1)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId2)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId3)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3],
        workItems: [workItem1, workItem2, workItem3],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2, workItem3],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });
      const status3 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId3 });

      expect(status1).toBe('complete');
      expect(status2).toBe('complete');
      expect(status3).toBe('complete');
    });
  });

  describe('codeweavers fail with null signal', () => {
    it('VALID: {3 codeweavers, agents return null signal} => all items marked failed', async () => {
      const stepId1 = StepIdStub({ value: 'step-aaa' });
      const stepId2 = StepIdStub({ value: 'step-bbb' });
      const stepId3 = StepIdStub({ value: 'step-ccc' });
      const step1 = DependencyStepStub({ id: stepId1 });
      const step2 = DependencyStepStub({ id: stepId2 });
      const step3 = DependencyStepStub({ id: stepId3 });

      const workItemId1 = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItemId2 = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItemId3 = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem1 = WorkItemStub({
        id: workItemId1,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId1)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId2)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId3)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3],
        workItems: [workItem1, workItem2, workItem3],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      // No auto-emit lines, no signal lines → signal is null → all agents fail
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2, workItem3],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });
      const status3 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId3 });

      expect(status1).toBe('failed');
      expect(status2).toBe('failed');
      expect(status3).toBe('failed');
    });
  });

  describe('quest not found', () => {
    it('ERROR: {quest does not exist} => throws', async () => {
      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        runCodeweaverLayerBroker({
          questId: QuestIdStub({ value: 'missing-quest' }),
          workItems: [],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('missing relatedDataItems', () => {
    it('ERROR: {work item has no relatedDataItems} => throws', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await expect(
        runCodeweaverLayerBroker({
          questId: quest.id,
          workItems: [workItem],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/no relatedDataItems/u);
    });
  });
});
