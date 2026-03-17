import {
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { ActiveAgentStub } from '../../../contracts/active-agent/active-agent.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { FollowupDepthStub } from '../../../contracts/followup-depth/followup-depth.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotIndexStub } from '../../../contracts/slot-index/slot-index.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from '../../../contracts/work-unit/work-unit.stub';
import { orchestrationLoopLayerBroker } from './orchestration-loop-layer-broker';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

describe('orchestrationLoopLayerBroker', () => {
  describe('all work complete', () => {
    it('VALID: {all complete, no active agents} => returns done with completed true', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => true,
        isAllTerminal: () => true,
        getReadyWorkIds: () => [],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
      });

      expect(result).toStrictEqual({ done: true, result: { completed: true } });
    });
  });

  describe('no work available', () => {
    it('VALID: {not all complete, no ready ids, no active agents} => returns completed false', async () => {
      orchestrationLoopLayerBrokerProxy();
      const incompleteId = WorkItemIdStub({ value: 'work-item-1' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [incompleteId],
        getFailedIds: () => [],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: { completed: false, incompleteIds: ['work-item-1'], failedIds: [] },
      });
    });
  });

  describe('all terminal with failures', () => {
    it('VALID: {isAllTerminal true, has failed ids, no active agents} => returns completed false with failedIds', async () => {
      orchestrationLoopLayerBrokerProxy();
      const failedId = WorkItemIdStub({ value: 'work-item-failed' });
      const workTracker = WorkTrackerStub({
        isAllTerminal: () => true,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [],
        getFailedIds: () => [failedId],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: { completed: false, incompleteIds: [], failedIds: ['work-item-failed'] },
      });
    });
  });

  describe('failed and incomplete work items', () => {
    it('VALID: {failed work item, no active agents} => returns completed false with failedIds', async () => {
      orchestrationLoopLayerBrokerProxy();
      const failedId = WorkItemIdStub({ value: 'work-item-failed' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [failedId],
        getFailedIds: () => [failedId],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: {
          completed: false,
          incompleteIds: ['work-item-failed'],
          failedIds: ['work-item-failed'],
        },
      });
    });

    it('VALID: {mix of complete and failed} => returns only incomplete and failed ids', async () => {
      orchestrationLoopLayerBrokerProxy();
      const incompleteId = WorkItemIdStub({ value: 'work-item-incomplete' });
      const failedId = WorkItemIdStub({ value: 'work-item-failed' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [incompleteId, failedId],
        getFailedIds: () => [failedId],
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [],
      });

      expect(result).toStrictEqual({
        done: true,
        result: {
          completed: false,
          incompleteIds: ['work-item-incomplete', 'work-item-failed'],
          failedIds: ['work-item-failed'],
        },
      });
    });
  });

  describe('followup agent completion', () => {
    it('VALID: {followup agent signals complete} => calls markStarted to reset instead of leaving complete', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        markStarted: mockMarkStarted,
        markCompleted: mockMarkCompleted,
      });

      const completeSignal = StreamSignalStub({ signal: 'complete' });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const followupAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 1 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [followupAgent],
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkStarted).toHaveBeenCalledTimes(1);
    });

    it('VALID: {non-followup agent signals complete} => does not call markStarted after signal handling', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        markStarted: mockMarkStarted,
        markCompleted: mockMarkCompleted,
      });

      const completeSignal = StreamSignalStub({ signal: 'complete' });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const nonFollowupAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [nonFollowupAgent],
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkStarted).toHaveBeenCalledTimes(0);
    });
  });

  describe('spawn_role path - siegemaster fails', () => {
    it('VALID: {siegemaster signals failed with summary} => skips pending, spawns pathseeker with questId and failureContext', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'siege-work-1' });
      const siegemasterWorkUnit = SiegemasterWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => siegemasterWorkUnit,
        markStarted: mockMarkStarted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Test assertion failed' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            workItemId: 'followup-siege-work-1-1700000000000',
            sessionId: null,
            followupDepth: 1,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(1);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);
      expect(mockMarkStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe('spawn_role path - codeweaver fails', () => {
    it('VALID: {codeweaver signals failed with summary} => skips pending, spawns pathseeker with questId and failureContext', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'codeweaver-work-1' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: mockMarkStarted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Build compilation error' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            workItemId: 'followup-codeweaver-work-1-1700000000000',
            sessionId: null,
            followupDepth: 1,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(1);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);
      expect(mockMarkStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe('spawn_role path - lawbringer fails', () => {
    it('VALID: {lawbringer signals failed} => skips pending, spawns spiritmender with file paths', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'lawbringer-work-1' });
      const lawbringerWorkUnit = LawbringerWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => lawbringerWorkUnit,
        markStarted: mockMarkStarted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Missing test coverage' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            workItemId: 'followup-lawbringer-work-1-1700000000000',
            sessionId: null,
            followupDepth: 1,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(1);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);
      expect(mockMarkStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe('spawn_role path - spiritmender fails', () => {
    it('VALID: {spiritmender signals failed} => skips pending, spawns pathseeker', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'spiritmender-work-1' });
      const spiritmenderWorkUnit = SpiritmenderWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => spiritmenderWorkUnit,
        markStarted: mockMarkStarted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Could not fix lint errors' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            workItemId: 'followup-spiritmender-work-1-1700000000000',
            sessionId: null,
            followupDepth: 1,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(1);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);
      expect(mockMarkStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe('spawn_role path - depth limit exceeded', () => {
    it('VALID: {failed signal beyond maxFollowupDepth} => calls markFailed, does not skip or spawn', async () => {
      orchestrationLoopLayerBrokerProxy();

      const workItemId = WorkItemIdStub({ value: 'siege-work-depth' });
      const siegemasterWorkUnit = SiegemasterWorkUnitStub();
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => siegemasterWorkUnit,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Repeated failure' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 3 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        maxFollowupDepth: FollowupDepthStub({ value: 3 }),
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkFailed).toHaveBeenCalledTimes(2);
      expect(mockSkipAllPending).toHaveBeenCalledTimes(0);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(0);
    });
  });

  describe('spawn_role path - no available slot', () => {
    it('VALID: {failed signal with no available slot} => skips pending, adds work item but does not spawn agent', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'siege-work-noslot' });
      const siegemasterWorkUnit = SiegemasterWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => siegemasterWorkUnit,
        markStarted: mockMarkStarted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({ signal: 'failed', summary: 'Test failure' as never });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub({
          getAvailableSlot: () => undefined,
        }),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(1);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);
      expect(mockMarkStarted).toHaveBeenCalledTimes(0);
    });
  });

  describe('crashed agent path', () => {
    it('VALID: {agent crashed} => respawns agent with resume session, does not mark failed', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-crashed' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const crashSessionId = SessionIdStub();
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: mockMarkFailed,
      });

      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: crashSessionId,
        exitCode: ExitCodeStub({ value: 1 }),
        crashed: true as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            workItemId: 'work-item-crashed',
            sessionId: crashSessionId,
            followupDepth: 0,
            promise: expect.any(Promise),
          },
        ],
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(0);
    });

    it('VALID: {agent timed out} => respawns agent', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-timeout' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const timeoutSessionId = SessionIdStub();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
      });

      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: timeoutSessionId,
        exitCode: ExitCodeStub({ value: 1 }),
        crashed: false as never,
        timedOut: true as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({
        done: false,
        activeAgents: [
          {
            slotIndex: SlotIndexStub({ value: 0 }),
            workItemId: 'work-item-timeout',
            sessionId: timeoutSessionId,
            followupDepth: 0,
            promise: expect.any(Promise),
          },
        ],
      });
    });
  });

  describe('null signal path', () => {
    it('VALID: {agent completes with no signal} => marks work item as failed', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-nosignal' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: mockMarkFailed,
      });

      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: null as never,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('spawn_role work unit verification', () => {
    it('VALID: {lawbringer fails} => addWorkItem receives spiritmender work unit with filePaths from original', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'lawbringer-verify' });
      const lawbringerWorkUnit = LawbringerWorkUnitStub();
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => lawbringerWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: mockAddWorkItem,
        skipAllPending: jest.fn().mockReturnValue(undefined),
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Lint errors found' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const addCall = mockAddWorkItem.mock.calls[0][0];

      expect(addCall.workUnit).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/broker.ts'],
        errors: ['Lint errors found'],
      });
    });

    it('VALID: {codeweaver fails} => addWorkItem receives pathseeker work unit with questId and failureContext', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'codeweaver-verify' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: mockAddWorkItem,
        skipAllPending: jest.fn().mockReturnValue(undefined),
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Build error in module' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const addCall = mockAddWorkItem.mock.calls[0][0];

      expect(addCall.workUnit).toStrictEqual({
        role: 'pathseeker',
        questId: 'add-auth',
        failureContext: 'Build error in module',
      });
    });

    it('VALID: {spiritmender fails} => addWorkItem receives pathseeker work unit with questId and failureContext', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'spiritmender-verify' });
      const spiritmenderWorkUnit = SpiritmenderWorkUnitStub();
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => spiritmenderWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: mockAddWorkItem,
        skipAllPending: jest.fn().mockReturnValue(undefined),
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Could not resolve type errors' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const addCall = mockAddWorkItem.mock.calls[0][0];

      expect(addCall.workUnit).toStrictEqual({
        role: 'pathseeker',
        questId: 'add-auth',
        failureContext: 'Could not resolve type errors',
      });
    });

    it('VALID: {lawbringer fails, no summary} => spiritmender work unit has no errors field', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'lawbringer-nosummary' });
      const lawbringerWorkUnit = LawbringerWorkUnitStub();
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => lawbringerWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: mockAddWorkItem,
        skipAllPending: jest.fn().mockReturnValue(undefined),
      });

      const failedSignal = StreamSignalStub({ signal: 'failed' });
      Reflect.deleteProperty(failedSignal, 'summary');
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const addCall = mockAddWorkItem.mock.calls[0][0];

      expect(addCall.workUnit).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/broker.ts'],
      });
    });
  });

  describe('bubble_to_user path - pathseeker fails', () => {
    it('VALID: {pathseeker signals failed} => does NOT skip pending, does NOT spawn recovery', async () => {
      orchestrationLoopLayerBrokerProxy();

      const workItemId = WorkItemIdStub({ value: 'pathseeker-work-1' });
      const pathseekerWorkUnit = PathseekerWorkUnitStub();
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => pathseekerWorkUnit,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Cannot plan steps' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
        timedOut: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(0);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(0);
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });
});
