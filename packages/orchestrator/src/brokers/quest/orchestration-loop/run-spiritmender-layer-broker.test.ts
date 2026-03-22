import {
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
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

const BATCH_ONE_FILE = JSON.stringify({
  filePaths: ['/project/src/file-a.ts'],
  errors: ['lint error in file-a'],
});

const BATCH_TWO_FILES = JSON.stringify({
  filePaths: ['/project/src/file-a.ts', '/project/src/file-b.ts'],
  errors: ['lint error in file-a', 'lint error in file-b'],
});

const BATCH_THREE_FILES = JSON.stringify({
  filePaths: ['/project/src/file-a.ts', '/project/src/file-b.ts', '/project/src/file-c.ts'],
  errors: ['lint error in file-a', 'lint error in file-b', 'lint error in file-c'],
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
      ).rejects.toThrow(/Quest.*not found/u);
    });
  });

  describe('result mapping', () => {
    it('VALID: {agent signals complete, 1 file batch} => marks quest work item complete', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [BATCH_ONE_FILE] });
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

    it('VALID: {agents signal complete, 2 file batch} => marks quest work item complete', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [BATCH_TWO_FILES] });
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

    it('VALID: {agents signal complete, 3 file batch fills slots} => marks quest work item complete', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [BATCH_THREE_FILES] });
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
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [BATCH_THREE_FILES] });
      // First spawn: skip auto-emit (no signal -> fail). Remaining spawns: auto-emit complete signal.
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
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const batchSixFiles = JSON.stringify({
        filePaths: [
          '/project/src/file-a.ts',
          '/project/src/file-b.ts',
          '/project/src/file-c.ts',
          '/project/src/file-d.ts',
          '/project/src/file-e.ts',
          '/project/src/file-f.ts',
        ],
        errors: [
          'error in file-a',
          'error in file-b',
          'error in file-c',
          'error in file-d',
          'error in file-e',
          'error in file-f',
        ],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [batchSixFiles] });
      // First spawn: skip auto-emit (no signal -> fail). Remaining spawns: auto-emit complete signal.
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
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [BATCH_THREE_FILES] });
      // No signal lines -> all agents fail -> result.completed = false
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

    it('VALID: {batch file not found} => creates empty work unit and marks complete', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      // No batchContents — fsReadFileAdapter will use default (empty string) which fails parse
      proxy.setupQuestFound({ quest });
      // Empty work unit still goes through slot manager
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
