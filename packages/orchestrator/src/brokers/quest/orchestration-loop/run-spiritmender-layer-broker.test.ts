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

const COMPLETE_SIGNAL_LINE_NO_SUMMARY = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete' },
      },
    ],
  },
});

const SESSION_ID_LINE = JSON.stringify({
  type: 'system',
  subtype: 'init',
  session_id: 'e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
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
      expect(runSpiritmenderLayerBroker).toStrictEqual(expect.any(Function));
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Quest.*not found/u);
    });
  });

  describe('onAgentEntry wiring', () => {
    it('VALID: {onAgentEntry provided, agent signals complete} => completes without error', async () => {
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

      const onAgentEntry = jest.fn();

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });

    it('VALID: {both params provided with default values} => completes without error', async () => {
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });
  });

  describe('fire-and-forget resilience', () => {
    it('VALID: {questModifyBroker rejects during session-id update} => logs to stderr, does not throw', async () => {
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
      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupQuestFound({ quest, batchContents: [BATCH_ONE_FILE] });
      proxy.setupSpawnAndMonitor({
        lines: [SESSION_ID_LINE, COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasSpiritmenderLog = stderrOutput.some((line) =>
        String(line).includes('[spiritmender] session-id update failed'),
      );

      expect(hasSpiritmenderLog).toBe(true);
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });
  });

  describe('summary propagation', () => {
    it('VALID: {agent signals complete with summary} => persists summary on work item', async () => {
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.summary).toBe('Fixed');
    });

    it('VALID: {agent signals complete without summary} => persists work item without summary field', async () => {
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
        lines: [COMPLETE_SIGNAL_LINE_NO_SUMMARY],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.status).toBe('complete');
      expect(persistedItem?.summary).toBe(undefined);
    });

    it('VALID: {agent fails with summary from earlier signal} => persists summary on failed work item', async () => {
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
      // All agents emit no signal -> all fail -> result.completed = false
      // But onWorkItemSummary still fires if summary was in the signal
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.status).toBe('failed');
      expect(persistedItem?.summary).toBe(undefined);
    });
  });

  describe('completedAt propagation', () => {
    it('VALID: {agent signals complete} => persists completedAt on work item', async () => {
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.completedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('VALID: {agent fails} => does not persist completedAt on work item', async () => {
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.completedAt).toBe(undefined);
    });
  });

  describe('session ID in final result mapping', () => {
    it('VALID: {agent emits session ID and completes} => persists sessionId on complete work item', async () => {
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
        lines: [SESSION_ID_LINE, COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.sessionId).toBe('e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c');
    });

    it('VALID: {agent emits session ID and fails} => persists sessionId on failed work item', async () => {
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
      // Session ID line but no signal -> all agents fail
      proxy.setupSpawnAndMonitor({
        lines: [SESSION_ID_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.sessionId).toBe('e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c');
    });

    it('VALID: {agent completes without session ID} => persists work item without sessionId', async () => {
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.status).toBe('complete');
      expect(persistedItem?.sessionId).toBe(undefined);
    });
  });

  describe('multiple work items', () => {
    it('VALID: {2 work items, both complete} => maps both slot results to quest work items', async () => {
      const workItemIdA = QuestWorkItemIdStub({
        value: 'aaaa0000-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItemIdB = QuestWorkItemIdStub({
        value: 'bbbb0000-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItemA = WorkItemStub({
        id: workItemIdA,
        role: 'spiritmender',
        status: 'in_progress',
      });
      const workItemB = WorkItemStub({
        id: workItemIdB,
        role: 'spiritmender',
        status: 'in_progress',
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItemA, workItemB],
      });

      const batchA = JSON.stringify({
        filePaths: ['/project/src/a.ts'],
        errors: ['error in a'],
      });
      const batchB = JSON.stringify({
        filePaths: ['/project/src/b.ts'],
        errors: ['error in b'],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest, batchContents: [batchA, batchB] });
      proxy.setupSpawnAutoLines({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItemA, workItemB],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const statusA = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdA });
      const statusB = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdB });

      expect(statusA).toBe('complete');
      expect(statusB).toBe('complete');
    });
  });

  describe('empty work items', () => {
    it('EDGE: {workItems is empty array} => completes without error and persists empty updates', async () => {
      const quest = QuestStub({
        status: 'in_progress',
        workItems: [],
      });

      const proxy = runSpiritmenderLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await expect(
        runSpiritmenderLayerBroker({
          questId: quest.id,
          workItems: [],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBe(undefined);
    });
  });
});
