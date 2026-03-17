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
import { runLawbringerLayerBroker } from './run-lawbringer-layer-broker';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';

const COMPLETE_SIGNAL_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        id: 'toolu_signal',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'Verified' },
      },
    ],
  },
});

describe('runLawbringerLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runLawbringerLayerBroker).toBe('function');
    });
  });

  describe('1 lawbringer success', () => {
    it('VALID: {1 lawbringer item, agent signals complete} => marks work item complete', async () => {
      const stepId = StepIdStub({ value: 'step-aaa' });
      const step = DependencyStepStub({ id: stepId });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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

  describe('2 lawbringers all success', () => {
    it('VALID: {2 lawbringer items, agents signal complete} => both marked complete', async () => {
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
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId1)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId2)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2],
        workItems: [workItem1, workItem2],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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

  describe('3 lawbringers all success', () => {
    it('VALID: {3 lawbringer items filling all slots, agents signal complete} => all 3 marked complete', async () => {
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
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId1)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId2)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId3)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3],
        workItems: [workItem1, workItem2, workItem3],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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

  describe('5 lawbringers all success (overflow slots)', () => {
    it('VALID: {5 lawbringer items beyond slot count, agents signal complete} => all 5 marked complete', async () => {
      const ids = [
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
      ];

      const steps = ids.map((_, i) =>
        DependencyStepStub({ id: StepIdStub({ value: `step-${String(i)}` }) }),
      );

      const workItemIds = ids.map((id) => QuestWorkItemIdStub({ value: id }));
      const workItems = workItemIds.map((id, i) =>
        WorkItemStub({
          id,
          role: 'lawbringer',
          status: 'in_progress',
          relatedDataItems: [`steps/${String(steps[i]!.id)}`],
        }),
      );

      const quest = QuestStub({
        status: 'in_progress',
        steps,
        workItems,
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupAutoEmitLines({ lines: [COMPLETE_SIGNAL_LINE] });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems,
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
      });

      const statuses = workItemIds.map((workItemId) =>
        proxy.getLastPersistedWorkItemStatus({ workItemId }),
      );

      expect(statuses).toStrictEqual(['complete', 'complete', 'complete', 'complete', 'complete']);
    });
  });

  describe('1 of 3 fails (null signal)', () => {
    it('VALID: {3 lawbringers, agents return null signal} => all items marked failed', async () => {
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
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId1)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId2)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepId3)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3],
        workItems: [workItem1, workItem2, workItem3],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      // No auto-emit lines, no signal → null signal → all agents fail
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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
      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        runLawbringerLayerBroker({
          questId: QuestIdStub({ value: 'missing-quest' }),
          workItems: [],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
