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

    it('VALID: {agents signal complete, 2 files} => marks quest work item complete', async () => {
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
      proxy.setupSpawnAutoLines({
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

    it('VALID: {agents signal complete, 3 files fills slots} => marks quest work item complete', async () => {
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
      proxy.setupSpawnAutoLines({
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

    it('VALID: {1 of 3 files fails, others succeed} => marks quest work item failed', async () => {
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
      // First spawn: skip auto-emit (no signal → fail). Remaining spawns: auto-emit complete signal.
      proxy.setupSpawnOnceLazy();
      proxy.setupSpawnAutoLines({
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

      expect(status).toBe('failed');
    });

    it('VALID: {6 files, 3 slots, 1 fails} => marks quest work item failed', async () => {
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
      // First spawn: skip auto-emit (no signal → fail). Remaining spawns: auto-emit complete signal.
      proxy.setupSpawnOnceLazy();
      proxy.setupSpawnAutoLines({
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

      expect(status).toBe('failed');
    });

    it('VALID: {all agents fail, 3 files} => marks quest work item failed for orchestration loop to handle skip + pathseeker', async () => {
      // NOTE: skip pending + pathseeker replan happens at the orchestration loop level,
      // not in this broker. This test verifies the broker correctly returns failed status
      // so the orchestration loop CAN perform skip + pathseeker.
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
      // No signal lines → all agents fail → result.completed = false
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

    it('ERROR: {wardResult missing from quest} => throws', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
        relatedDataItems: ['wardResults/non-existent-ward-result-id'],
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
      ).rejects.toThrow(/WardResult .* not found/u);
    });

    it('VALID: {0 files in wardResult} => marks quest work item complete without spawning agents', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        filePaths: [],
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
      // No spawn mock setup needed — 0 work units means no agents spawned

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
