import {
  AbsoluteFilePathStub,
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WardResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { runSpiritmenderLayerBroker } from './run-spiritmender-layer-broker';
import { runSpiritmenderLayerBrokerProxy } from './run-spiritmender-layer-broker.proxy';

const COMPLETE_SIGNAL_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'Fixed' },
      },
    ],
  },
});

describe('runSpiritmenderLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runSpiritmenderLayerBroker).toBe('function');
    });
  });

  describe('quest not found', () => {
    it('ERROR: {quest does not exist} => throws', async () => {
      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        runSpiritmenderLayerBroker({
          questId: QuestIdStub({ value: 'missing-quest' }),
          workItems: [],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('result mapping', () => {
    it('VALID: {agent signals complete, 1 file} => marks quest work item complete', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [AbsoluteFilePathStub({ value: '/project/src/file-a.ts' })],
        errorSummary: 'lint errors',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });

    it('VALID: {agents fail with null signal, 3 files} => marks quest work item failed', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [
          AbsoluteFilePathStub({ value: '/project/src/file-a.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-b.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-c.ts' }),
        ],
        errorSummary: 'test failures',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      // No signal lines + exit 0 → signal is null → workTracker.markFailed
      // With 3 files but 1 quest work item, the old per-ID mapping only checked
      // work-item-0 against failedSlotIds. The fix uses result.completed instead.
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });
  });

  describe('file count variations', () => {
    it('VALID: {2 files, all agents signal complete} => marks quest work item complete', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [
          AbsoluteFilePathStub({ value: '/project/src/file-a.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-b.ts' }),
        ],
        errorSummary: 'lint errors',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitorMulti({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });

    it('VALID: {3 files filling all slots, all agents signal complete} => marks quest work item complete', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [
          AbsoluteFilePathStub({ value: '/project/src/file-a.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-b.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-c.ts' }),
        ],
        errorSummary: 'lint errors',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitorMulti({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });

    it('VALID: {3 files, agents fail with null signal} => marks quest work item failed', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [
          AbsoluteFilePathStub({ value: '/project/src/file-a.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-b.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-c.ts' }),
        ],
        errorSummary: 'type errors',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });

    it('VALID: {6 files across 3 slots, agents fail} => marks quest work item failed', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [
          AbsoluteFilePathStub({ value: '/project/src/file-a.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-b.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-c.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-d.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-e.ts' }),
          AbsoluteFilePathStub({ value: '/project/src/file-f.ts' }),
        ],
        errorSummary: 'multiple failures',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });
  });

  describe('failure recovery', () => {
    it('VALID: {spiritmender agent exits with no signal} => quest work item status is failed for downstream handling', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [AbsoluteFilePathStub({ value: '/project/src/file-a.ts' })],
        errorSummary: 'lint errors',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });
  });

  describe('exception handling', () => {
    it('ERROR: {wardResult reference missing from quest} => throws', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: ['wardResults/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runSpiritmenderLayerBroker({
          questId: quest.id,
          workItems: [workItem],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
        }),
      ).rejects.toThrow(/WardResult.*not found/u);
    });
  });

  describe('edge cases', () => {
    it('VALID: {0 files in wardResult} => marks quest work item complete with no work units', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [],
        errorSummary: 'no files affected',
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
        wardResults: [wardResult],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
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
});
