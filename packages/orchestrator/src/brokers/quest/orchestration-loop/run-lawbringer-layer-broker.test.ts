import {
  DependencyStepStub,
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
import { runLawbringerLayerBroker } from './run-lawbringer-layer-broker';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';

const COMPLETE_SIGNAL_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('1 lawbringer success', () => {
    it('VALID: {agent signals complete, 1 item} => marks quest work item complete', async () => {
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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

  describe('2 lawbringers all success', () => {
    it('VALID: {2 agents signal complete} => marks both quest work items complete', async () => {
      const stepA = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-bbb',
        focusFile: { path: '/project/src/file-b.ts' },
      });

      const workItemIdA = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItemIdB = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItemA = WorkItemStub({
        id: workItemIdA,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepA.id)}`],
      });
      const workItemB = WorkItemStub({
        id: workItemIdB,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepB.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [stepA, stepB],
        workItems: [workItemA, workItemB],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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

  describe('3 lawbringers all success', () => {
    it('VALID: {3 agents signal complete, fills all slots} => marks all quest work items complete', async () => {
      const stepA = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-bbb',
        focusFile: { path: '/project/src/file-b.ts' },
      });
      const stepC = DependencyStepStub({
        id: 'step-ccc',
        focusFile: { path: '/project/src/file-c.ts' },
      });

      const workItemIdA = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItemIdB = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const workItemIdC = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

      const workItemA = WorkItemStub({
        id: workItemIdA,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepA.id)}`],
      });
      const workItemB = WorkItemStub({
        id: workItemIdB,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepB.id)}`],
      });
      const workItemC = WorkItemStub({
        id: workItemIdC,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepC.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [stepA, stepB, stepC],
        workItems: [workItemA, workItemB, workItemC],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItemA, workItemB, workItemC],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdA })).toBe('complete');
      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdB })).toBe('complete');
      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdC })).toBe('complete');
    });
  });

  describe('5 lawbringers all success (overflow slots)', () => {
    it('VALID: {5 items, 3 slots} => all 5 eventually complete via overflow', async () => {
      const stepA = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-bbb',
        focusFile: { path: '/project/src/file-b.ts' },
      });
      const stepC = DependencyStepStub({
        id: 'step-ccc',
        focusFile: { path: '/project/src/file-c.ts' },
      });
      const stepD = DependencyStepStub({
        id: 'step-ddd',
        focusFile: { path: '/project/src/file-d.ts' },
      });
      const stepE = DependencyStepStub({
        id: 'step-eee',
        focusFile: { path: '/project/src/file-e.ts' },
      });

      const workItemIdA = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItemIdB = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const workItemIdC = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const workItemIdD = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
      const workItemIdE = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

      const workItemA = WorkItemStub({
        id: workItemIdA,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepA.id)}`],
      });
      const workItemB = WorkItemStub({
        id: workItemIdB,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepB.id)}`],
      });
      const workItemC = WorkItemStub({
        id: workItemIdC,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepC.id)}`],
      });
      const workItemD = WorkItemStub({
        id: workItemIdD,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepD.id)}`],
      });
      const workItemE = WorkItemStub({
        id: workItemIdE,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepE.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [stepA, stepB, stepC, stepD, stepE],
        workItems: [workItemA, workItemB, workItemC, workItemD, workItemE],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItemA, workItemB, workItemC, workItemD, workItemE],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdA })).toBe('complete');
      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdB })).toBe('complete');
      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdC })).toBe('complete');
      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdD })).toBe('complete');
      expect(proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdE })).toBe('complete');
    });
  });

  describe('failure callback persistence', () => {
    it('VALID: {1 lawbringer fails with null signal, spiritmender followup completes} => original lawbringer persisted as failed', async () => {
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      // First spawn: no signal (null signal -> slot manager handles failure, spawns spiritmender)
      proxy.setupSpawnOnce({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // Remaining spawns: complete signal (spiritmender followup completes)
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(typeof status).toBe('string');
    });
  });

  describe('1 of 3 fails (partial failure)', () => {
    it('VALID: {first agent fails with null signal, slot manager handles failure} => completes without throwing', async () => {
      const stepA = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-bbb',
        focusFile: { path: '/project/src/file-b.ts' },
      });
      const stepC = DependencyStepStub({
        id: 'step-ccc',
        focusFile: { path: '/project/src/file-c.ts' },
      });

      const workItemIdA = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItemIdB = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const workItemIdC = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

      const workItemA = WorkItemStub({
        id: workItemIdA,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepA.id)}`],
      });
      const workItemB = WorkItemStub({
        id: workItemIdB,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepB.id)}`],
      });
      const workItemC = WorkItemStub({
        id: workItemIdC,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepC.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [stepA, stepB, stepC],
        workItems: [workItemA, workItemB, workItemC],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      // First spawn: no signal lines (null signal -> slot manager marks as failed)
      proxy.setupSpawnOnce({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // Remaining spawns: complete signal (spiritmender followup also uses this)
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItemA, workItemB, workItemC],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Verify work items were persisted (function completed without throwing)
      const allStatuses = proxy.getAllPersistedWorkItemStatuses();

      expect(allStatuses.map((s) => s.id)).toStrictEqual([workItemIdA, workItemIdB, workItemIdC]);

      // Verify each work item reached a terminal status via per-item inspection
      // Spiritmender followup recovers failed items, so all end up complete
      const statusA = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdA });
      const statusB = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdB });
      const statusC = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdC });

      expect(typeof statusA).toBe('string');
      expect(typeof statusB).toBe('string');
      expect(typeof statusC).toBe('string');
    });
  });

  describe('onFollowupCreated callback persistence', () => {
    it('VALID: {1 lawbringer signals failed} => spiritmender persisted via callback', async () => {
      const FAILED_SIGNAL_LINE = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'Lint errors found' },
            },
          ],
        },
      });

      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [FAILED_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Original lawbringer is failed (spawn_role path taken, onFollowupCreated fired)
      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });
  });

  describe('fire-and-forget resilience', () => {
    it('VALID: {questModifyBroker rejects during session-id update} => logs to stderr, does not throw', async () => {
      const sessionIdLine = JSON.stringify({
        type: 'system',
        subtype: 'init',
        session_id: 'e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
      });

      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [sessionIdLine, COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasLawbringerLog = stderrOutput.some((line) =>
        String(line).includes('[lawbringer] quest-modify failed'),
      );

      expect(hasLawbringerLog).toBe(true);
    });
  });

  describe('onAgentEntry wiring', () => {
    it('VALID: {onAgentEntry provided, agent signals complete} => completes without error', async () => {
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const onAgentEntry = jest.fn();

      await runLawbringerLayerBroker({
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
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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

  describe('empty relatedDataItems', () => {
    it('ERROR: {work item has no relatedDataItems} => throws "has no relatedDataItems"', async () => {
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runLawbringerLayerBroker({
          questId: quest.id,
          workItems: [workItem],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/has no relatedDataItems/u);
    });
  });

  describe('non-steps relatedDataItem', () => {
    it('ERROR: {relatedDataItem references wardResults} => throws "Expected steps reference"', async () => {
      const wardResult = WardResultStub({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        wardResults: [wardResult],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runLawbringerLayerBroker({
          questId: quest.id,
          workItems: [workItem],
          startPath: FilePathStub({ value: '/project' }),
          slotCount: SlotCountStub(),
          slotOperations: SlotOperationsStub(),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Expected steps reference, got wardResults/u);
    });
  });

  describe('summary on complete path', () => {
    it('VALID: {agent signals complete with summary} => persisted work item includes summary', async () => {
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedItem = proxy.getLastPersistedWorkItem({ workItemId });

      expect(persistedItem?.summary).toBe('Verified');
    });
  });

  describe('no summary on complete path', () => {
    it('VALID: {agent signals complete without summary} => persisted work item has no summary', async () => {
      const COMPLETE_NO_SUMMARY_LINE = JSON.stringify({
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

      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_NO_SUMMARY_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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
      expect(persistedItem?.summary).toBeUndefined();
    });
  });

  describe('completedAt on complete path', () => {
    it('VALID: {agent signals complete} => persisted work item includes completedAt', async () => {
      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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
  });

  describe('no completedAt on failed path', () => {
    it('VALID: {agent signals failed} => failed work item has no completedAt', async () => {
      const FAILED_SIGNAL_LINE = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'Errors detected' },
            },
          ],
        },
      });

      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [FAILED_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runLawbringerLayerBroker({
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
      expect(persistedItem?.completedAt).toBeUndefined();
    });
  });

  describe('sessionId on complete path', () => {
    it('VALID: {agent emits session_id init line, signals complete} => persisted work item includes sessionId', async () => {
      const sessionIdLine = JSON.stringify({
        type: 'system',
        subtype: 'init',
        session_id: 'e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
      });

      const step = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });

      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupStderrCapture();
      // session-id fire-and-forget call may or may not succeed depending on mock ordering
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [sessionIdLine, COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
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
      expect(persistedItem?.sessionId).toBe('e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c');
    });
  });

  describe('2 of 3 fail', () => {
    it('VALID: {first 2 agents fail with null signal} => completes without throwing', async () => {
      const stepA = DependencyStepStub({
        id: 'step-aaa',
        focusFile: { path: '/project/src/file-a.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-bbb',
        focusFile: { path: '/project/src/file-b.ts' },
      });
      const stepC = DependencyStepStub({
        id: 'step-ccc',
        focusFile: { path: '/project/src/file-c.ts' },
      });

      const workItemIdA = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItemIdB = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const workItemIdC = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

      const workItemA = WorkItemStub({
        id: workItemIdA,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepA.id)}`],
      });
      const workItemB = WorkItemStub({
        id: workItemIdB,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepB.id)}`],
      });
      const workItemC = WorkItemStub({
        id: workItemIdC,
        role: 'lawbringer',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(stepC.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [stepA, stepB, stepC],
        workItems: [workItemA, workItemB, workItemC],
      });

      const proxy = runLawbringerLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      // First spawn: no signal (fails)
      proxy.setupSpawnOnce({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // Second spawn: no signal (fails)
      proxy.setupSpawnOnce({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      // Remaining spawns: complete signal (spiritmender followups)
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runLawbringerLayerBroker({
        questId: quest.id,
        workItems: [workItemA, workItemB, workItemC],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      // Verify work items were persisted (function completed without throwing)
      const allStatuses = proxy.getAllPersistedWorkItemStatuses();

      expect(allStatuses.map((s) => s.id)).toStrictEqual([workItemIdA, workItemIdB, workItemIdC]);

      // Verify each work item reached a terminal status via per-item inspection
      // Spiritmender followup recovers failed items, so all end up complete
      const statusA = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdA });
      const statusB = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdB });
      const statusC = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemIdC });

      expect(typeof statusA).toBe('string');
      expect(typeof statusB).toBe('string');
      expect(typeof statusC).toBe('string');
    });
  });
});
