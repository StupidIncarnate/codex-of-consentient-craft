import {
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationCallbacksParamsStub } from '../../../contracts/orchestration-callbacks/orchestration-callbacks.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { runSpiritmenderLayerBroker } from './run-spiritmender-layer-broker';
import { runSpiritmenderLayerBrokerProxy } from './run-spiritmender-layer-broker.proxy';

type OnAgentEntryParams = ReturnType<typeof OrchestrationCallbacksParamsStub>['onAgentEntryParams'];

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

    it('VALID: {slot manager emits agent entry with internal work-item-0 id} => responder receives translated QuestWorkItemId (UUID)', async () => {
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

      const onAgentEntry: jest.MockedFunction<(params: OnAgentEntryParams) => void> = jest.fn();

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      // The slot manager surfaces its internal `workItemId` (e.g. 'work-item-0') via the
      // raw `onLine`-driven callback. The spiritmender broker translates that to the
      // quest's `QuestWorkItemId` (UUID) before invoking the responder-facing onAgentEntry.
      // Note: questId is intentionally NOT forwarded — OnAgentEntryCallback's payload is
      // {slotIndex, entry, questWorkItemId, sessionId?}; questId is layered on by the
      // responder via build-orchestration-loop-on-agent-entry-transformer.
      const receivedPayloads = onAgentEntry.mock.calls.map((call) => call[0]);

      expect(receivedPayloads).toStrictEqual([
        {
          slotIndex: 0,
          entry: { raw: COMPLETE_SIGNAL_LINE },
          questWorkItemId: workItemId,
        },
      ]);
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
      const sessionIdLine = JSON.stringify({
        type: 'system',
        subtype: 'init',
        session_id: 'e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
      });

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
        lines: [sessionIdLine, COMPLETE_SIGNAL_LINE],
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

  describe('abort signal', () => {
    it('VALID: {abortSignal already aborted, 1 spiritmender in_progress} => work item remains in_progress (not marked complete)', async () => {
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
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
      proxy.setupQuestFound({ quest });

      const controller = new AbortController();
      controller.abort();

      await runSpiritmenderLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: controller.signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });
      const completedAt = proxy.getLastPersistedWorkItemCompletedAt({ workItemId });

      expect(status).toBe('in_progress');
      expect(completedAt).toBe(undefined);
    });
  });
});
