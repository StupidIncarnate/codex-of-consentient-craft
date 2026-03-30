import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WardResultStub,
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
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'Done' },
      },
    ],
  },
});

describe('runCodeweaverLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(runCodeweaverLayerBroker).toStrictEqual(expect.any(Function));
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('missing relatedDataItems', () => {
    it('ERROR: {work item has no relatedDataItems} => throws', async () => {
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [],
      });

      const quest = QuestStub({
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runCodeweaverLayerBroker({
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

  describe('result mapping', () => {
    it('VALID: {1 codeweaver, agent signals complete} => marks work item complete', async () => {
      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
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

    it('VALID: {2 codeweavers, both signal complete} => marks both work items complete', async () => {
      const step1 = DependencyStepStub({ id: 'step-1' });
      const step2 = DependencyStepStub({ id: 'step-2' });

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
        relatedDataItems: [`steps/${String(step1.id)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step2.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2],
        workItems: [workItem1, workItem2],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAutoLines({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });

      expect(status1).toBe('complete');
      expect(status2).toBe('complete');
    });

    it('VALID: {3 codeweavers, all signal complete} => marks all 3 work items complete', async () => {
      const step1 = DependencyStepStub({ id: 'step-1' });
      const step2 = DependencyStepStub({ id: 'step-2' });
      const step3 = DependencyStepStub({ id: 'step-3' });

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
        relatedDataItems: [`steps/${String(step1.id)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step2.id)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step3.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3],
        workItems: [workItem1, workItem2, workItem3],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAutoLines({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2, workItem3],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });
      const status3 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId3 });

      expect(status1).toBe('complete');
      expect(status2).toBe('complete');
      expect(status3).toBe('complete');
    });

    it('VALID: {1 codeweaver, null signal} => marks work item failed', async () => {
      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });

    it('VALID: {3 codeweavers, first completes rest fail} => maps failedIds to failed quest work items', async () => {
      const step1 = DependencyStepStub({ id: 'step-1' });
      const step2 = DependencyStepStub({ id: 'step-2' });
      const step3 = DependencyStepStub({ id: 'step-3' });

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
        relatedDataItems: [`steps/${String(step1.id)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step2.id)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step3.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3],
        workItems: [workItem1, workItem2, workItem3],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      // Signal lines reach only the first spawn (readline mock timing).
      // First spawn gets complete signal, subsequent spawns get null signal.
      // This creates partial failure: work-item-0 completes, work-item-1/2 fail.
      // Exercises the failedIds→quest work item mapping at impl lines 87-101.
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2, workItem3],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });
      const status3 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId3 });

      expect(status1).toBe('complete');
      expect(status2).toBe('failed');
      expect(status3).toBe('failed');
    });

    it('VALID: {5 codeweavers with slotCount 3, first completes rest fail} => maps failedIds correctly', async () => {
      const step1 = DependencyStepStub({ id: 'step-1' });
      const step2 = DependencyStepStub({ id: 'step-2' });
      const step3 = DependencyStepStub({ id: 'step-3' });
      const step4 = DependencyStepStub({ id: 'step-4' });
      const step5 = DependencyStepStub({ id: 'step-5' });

      const workItemId1 = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItemId2 = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItemId3 = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const workItemId4 = QuestWorkItemIdStub({
        value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
      });
      const workItemId5 = QuestWorkItemIdStub({
        value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
      });

      const workItem1 = WorkItemStub({
        id: workItemId1,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step1.id)}`],
      });
      const workItem2 = WorkItemStub({
        id: workItemId2,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step2.id)}`],
      });
      const workItem3 = WorkItemStub({
        id: workItemId3,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step3.id)}`],
      });
      const workItem4 = WorkItemStub({
        id: workItemId4,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step4.id)}`],
      });
      const workItem5 = WorkItemStub({
        id: workItemId5,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step5.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step1, step2, step3, step4, step5],
        workItems: [workItem1, workItem2, workItem3, workItem4, workItem5],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      // Same readline timing: only first spawn gets complete signal.
      // With 5 items and slotCount 3, verifies overflow with partial failure.
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem1, workItem2, workItem3, workItem4, workItem5],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status1 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId1 });
      const status2 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId2 });
      const status3 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId3 });
      const status4 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId4 });
      const status5 = proxy.getLastPersistedWorkItemStatus({ workItemId: workItemId5 });

      // First item completes (got signal), rest fail (null signal due to readline timing)
      expect(status1).toBe('complete');
      expect(status2).toBe('failed');
      expect(status3).toBe('failed');
      expect(status4).toBe('failed');
      expect(status5).toBe('failed');
    });
  });

  describe('failure callback persistence', () => {
    it('VALID: {1 codeweaver, null signal} => failed codeweaver quest work item persisted with failed status', async () => {
      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
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
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });
  });

  describe('onFollowupCreated callback persistence', () => {
    it('VALID: {1 codeweaver signals failed} => pathseeker replan persisted via callback', async () => {
      const FAILED_SIGNAL_LINE = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'Build error' },
            },
          ],
        },
      });

      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAutoLines({
        lines: [FAILED_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persisted = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(persisted).toBe('failed');
    });

    it('VALID: {1 codeweaver signals failed, followup also fails} => result-mapping sets final status on recovery item', async () => {
      const FAILED_SIGNAL_LINE = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'Build error' },
            },
          ],
        },
      });

      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });
      // First spawn fails (codeweaver), subsequent spawns complete (pathseeker followup)
      proxy.setupSpawnAutoLines({
        lines: [FAILED_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      // Original codeweaver is failed, which is a terminal status (not stuck at pending)
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

      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupStderrCapture();
      proxy.setupModifyReject({ error: new Error('network failure') });
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [sessionIdLine, COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const stderrOutput = proxy.getStderrWrites();
      const hasCodeweaverLog = stderrOutput.some((line) =>
        String(line).includes('[codeweaver] quest-modify failed'),
      );

      expect(hasCodeweaverLog).toBe(true);
    });
  });

  describe('sessionId persistence', () => {
    it('VALID: {1 codeweaver, agent has sessionId} => persists sessionId on quest work item', async () => {
      const sessionId = SessionIdStub({ value: 'e7a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c' });
      const sessionIdLine = JSON.stringify({
        type: 'system',
        subtype: 'init',
        session_id: String(sessionId),
      });

      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [sessionIdLine, COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const persistedSessionId = proxy.getLastPersistedWorkItemSessionId({ workItemId });

      expect(persistedSessionId).toBe(sessionId);
    });
  });

  describe('non-steps relatedDataItem', () => {
    it('ERROR: {work item references wardResults collection} => throws Expected steps reference', async () => {
      const wardResult = WardResultStub({
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`wardResults/${String(wardResult.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        wardResults: [wardResult],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await expect(
        runCodeweaverLayerBroker({
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

  describe('summary persistence', () => {
    it('VALID: {1 codeweaver signals complete with summary} => persists summary on complete work item', async () => {
      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const summary = proxy.getLastPersistedWorkItemSummary({ workItemId });

      expect(String(summary)).toBe('Done');
    });

    it('VALID: {1 codeweaver signals complete without summary} => no summary on work item', async () => {
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

      const step = DependencyStepStub({ id: 'step-1' });
      const workItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        status: 'in_progress',
        relatedDataItems: [`steps/${String(step.id)}`],
      });

      const quest = QuestStub({
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runCodeweaverLayerBrokerProxy();
      proxy.setupQuestFound({ quest });
      proxy.setupSpawnAndMonitor({
        lines: [COMPLETE_NO_SUMMARY_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runCodeweaverLayerBroker({
        questId: quest.id,
        workItems: [workItem],
        startPath: FilePathStub({ value: '/project' }),
        slotCount: SlotCountStub(),
        slotOperations: SlotOperationsStub(),
        onAgentEntry: jest.fn(),
        abortSignal: new AbortController().signal,
      });

      const summary = proxy.getLastPersistedWorkItemSummary({ workItemId });

      expect(summary).toBeUndefined();
    });
  });
});
