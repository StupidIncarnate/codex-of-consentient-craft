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
import { SlotManagerResultStub } from '../../../contracts/slot-manager-result/slot-manager-result.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ done: true, result: { completed: true, sessionIds: {} } });
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({
        done: true,
        result: { completed: false, incompleteIds: ['work-item-1'], failedIds: [], sessionIds: {} },
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({
        done: true,
        result: {
          completed: false,
          incompleteIds: [],
          failedIds: ['work-item-failed'],
          sessionIds: {},
        },
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({
        done: true,
        result: {
          completed: false,
          incompleteIds: ['work-item-failed'],
          failedIds: ['work-item-failed'],
          sessionIds: {},
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [],
        sessionIds: {},
      });

      expect(result).toStrictEqual({
        done: true,
        result: {
          completed: false,
          incompleteIds: ['work-item-incomplete', 'work-item-failed'],
          failedIds: ['work-item-failed'],
          sessionIds: {},
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [followupAgent],
        sessionIds: {},
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [nonFollowupAgent],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkStarted).toHaveBeenCalledTimes(0);
    });
  });

  describe('spawn_role path - siegemaster fails', () => {
    it('VALID: {siegemaster signals failed with summary} => skips pending, spawns pathseeker without transitioning quest status', async () => {
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'followup-siege-work-1-1700000000000',
        sessionId: null,
        followupDepth: 1,
        crashRetries: 0,
      });
      expect({
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
        markStarted: mockMarkStarted.mock.calls.length,
      }).toStrictEqual({
        skipAllPending: 1,
        addWorkItem: 1,
        markStarted: 1,
      });
      // Siegemaster failure keeps its fix-chain model — no quest status transition
      expect(proxy.getQuestModifyCalls()).toStrictEqual([]);
    });
  });

  describe('spawn_role path - codeweaver fails', () => {
    it('VALID: {codeweaver signals failed with summary} => drains pending, transitions quest to seek_walk, spawns pathseeker in that order', async () => {
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'followup-codeweaver-work-1-1700000000000',
        sessionId: null,
        followupDepth: 1,
        crashRetries: 0,
      });
      expect({
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
        markStarted: mockMarkStarted.mock.calls.length,
      }).toStrictEqual({
        skipAllPending: 1,
        addWorkItem: 1,
        markStarted: 1,
      });
      // Codeweaver failure drains pending work, transitions quest backward to seek_walk,
      // then spawns a recovery pathseeker — verify the single modify-quest call targeted seek_walk.
      expect(proxy.getQuestModifyCalls()).toStrictEqual([
        { input: { questId: QuestIdStub({ value: 'add-auth' }), status: 'seek_walk' } },
      ]);

      // Drain must precede status transition which must precede spawn work item insert.
      const drainOrder = mockSkipAllPending.mock.invocationCallOrder[0]!;
      const spawnOrder = mockAddWorkItem.mock.invocationCallOrder[0]!;

      expect(drainOrder).toBeLessThan(spawnOrder);
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'followup-lawbringer-work-1-1700000000000',
        sessionId: null,
        followupDepth: 1,
        crashRetries: 0,
      });
      expect({
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
        markStarted: mockMarkStarted.mock.calls.length,
      }).toStrictEqual({
        skipAllPending: 1,
        addWorkItem: 1,
        markStarted: 1,
      });
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'followup-spiritmender-work-1-1700000000000',
        sessionId: null,
        followupDepth: 1,
        crashRetries: 0,
      });
      expect({
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
        markStarted: mockMarkStarted.mock.calls.length,
      }).toStrictEqual({
        skipAllPending: 1,
        addWorkItem: 1,
        markStarted: 1,
      });
      // Spiritmender failure drains pending work, transitions quest backward to seek_walk,
      // then spawns a recovery pathseeker.
      expect(proxy.getQuestModifyCalls()).toStrictEqual([
        { input: { questId: QuestIdStub({ value: 'add-auth' }), status: 'seek_walk' } },
      ]);

      const drainOrder = mockSkipAllPending.mock.invocationCallOrder[0]!;
      const spawnOrder = mockAddWorkItem.mock.invocationCallOrder[0]!;

      expect(drainOrder).toBeLessThan(spawnOrder);
    });
  });

  describe('spawn_role path - spiritmender fails, modify-quest transition rejects', () => {
    it('VALID: {spiritmender signals failed, modify-quest rejects} => drains, logs error, still spawns recovery pathseeker', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });
      proxy.setupReplanTransitionReject({ error: new Error('gate-content check failed') });

      const workItemId = WorkItemIdStub({ value: 'spiritmender-reject-1' });
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
        summary: 'Cannot fix' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      // Recovery pathseeker is still spawned despite the transition rejection.
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'followup-spiritmender-reject-1-1700000000000',
        sessionId: null,
        followupDepth: 1,
        crashRetries: 0,
      });
      expect({
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
        markStarted: mockMarkStarted.mock.calls.length,
      }).toStrictEqual({
        skipAllPending: 1,
        addWorkItem: 1,
        markStarted: 1,
      });
      // Modify-quest was attempted with seek_walk before the drain+spawn completed.
      expect(proxy.getQuestModifyCalls()).toStrictEqual([
        { input: { questId: QuestIdStub({ value: 'add-auth' }), status: 'seek_walk' } },
      ]);
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        maxFollowupDepth: FollowupDepthStub({ value: 3 }),
        sessionIds: {},
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

        slotOperations: SlotOperationsStub({
          getAvailableSlot: () => undefined,
        }),
        activeAgents: [activeAgent],
        sessionIds: {},
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'work-item-crashed',
        sessionId: crashSessionId,
        followupDepth: 0,
        crashRetries: 1,
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(0);
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const [[addCall]] = mockAddWorkItem.mock.calls;

      expect(addCall.workUnit).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/broker.ts'],
        errors: ['Lint errors found'],
        contextInstructions:
          '## Instructions\nA code review agent (lawbringer) found issues it could not auto-fix in the listed files. Read the failure summary below for context on what is wrong. Examine the files, understand the issue, and fix it. Run npm run ward on the files to verify.',
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const [[addCall]] = mockAddWorkItem.mock.calls;

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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const [[addCall]] = mockAddWorkItem.mock.calls;

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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(mockAddWorkItem).toHaveBeenCalledTimes(1);

      const [[addCall]] = mockAddWorkItem.mock.calls;

      expect(addCall.workUnit).toStrictEqual({
        role: 'spiritmender',
        filePaths: ['/src/broker.ts'],
        contextInstructions:
          '## Instructions\nA code review agent (lawbringer) found issues it could not auto-fix in the listed files. Read the failure summary below for context on what is wrong. Examine the files, understand the issue, and fix it. Run npm run ward on the files to verify.',
      });
    });
  });

  describe('spawn_role path - onFollowupCreated callback', () => {
    it('VALID: {codeweaver fails, onFollowupCreated provided} => callback fires with correct params', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'codeweaver-callback-1' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const mockOnFollowupCreated = jest.fn();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: jest.fn().mockReturnValue(undefined),
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Build error' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        onFollowupCreated: mockOnFollowupCreated,
      });

      expect(mockOnFollowupCreated).toHaveBeenCalledTimes(1);
      expect(mockOnFollowupCreated).toHaveBeenCalledWith({
        followupWorkItemId: 'followup-codeweaver-callback-1-1700000000000',
        role: 'pathseeker',
        failedWorkItemId: 'codeweaver-callback-1',
      });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(1);
    });

    it('VALID: {lawbringer fails, onFollowupCreated provided} => callback fires with spiritmender role', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'lawbringer-callback-1' });
      const lawbringerWorkUnit = LawbringerWorkUnitStub();
      const mockOnFollowupCreated = jest.fn();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => lawbringerWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: jest.fn().mockReturnValue(undefined),
        skipAllPending: jest.fn().mockReturnValue(undefined),
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Lint errors' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        onFollowupCreated: mockOnFollowupCreated,
      });

      expect(mockOnFollowupCreated).toHaveBeenCalledTimes(1);
      expect(mockOnFollowupCreated).toHaveBeenCalledWith({
        followupWorkItemId: 'followup-lawbringer-callback-1-1700000000000',
        role: 'spiritmender',
        failedWorkItemId: 'lawbringer-callback-1',
      });
    });

    it('VALID: {followup-of-followup, lawbringer then spiritmender fail} => callback fires twice with correct chain', async () => {
      const FAILED_SIGNAL_LINE = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'Lint errors' },
            },
          ],
        },
      });

      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });
      proxy.setupSpawnAutoLines({
        lines: [FAILED_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const workItemId = WorkItemIdStub({ value: 'lawbringer-chain-1' });
      const lawbringerWorkUnit = LawbringerWorkUnitStub();
      const spiritmenderWorkUnit = SpiritmenderWorkUnitStub();
      const mockOnFollowupCreated = jest.fn();
      const mockGetWorkUnit = jest.fn().mockReturnValue(lawbringerWorkUnit);

      const activeAgentsList: ReturnType<typeof ActiveAgentStub>[] = [];

      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: mockGetWorkUnit,
        markStarted: jest.fn().mockResolvedValue(undefined),
        markFailed: jest.fn().mockResolvedValue(undefined),
        addWorkItem: jest.fn().mockReturnValue(undefined),
        skipAllPending: jest.fn().mockReturnValue(undefined),
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Lint errors' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      activeAgentsList.push(activeAgent);

      const startPath = FilePathStub({ value: '/project/src' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const sessionIds = SlotManagerResultStub().sessionIds as never;

      // First call: lawbringer fails -> spawns spiritmender followup
      const result1 = await orchestrationLoopLayerBroker({
        questId,
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: activeAgentsList,
        sessionIds,
        onFollowupCreated: mockOnFollowupCreated,
      });

      expect(mockOnFollowupCreated).toHaveBeenCalledTimes(1);
      expect(result1.done).toBe(false);

      // Reconfigure getWorkUnit to return spiritmender for the followup agent
      mockGetWorkUnit.mockReturnValue(spiritmenderWorkUnit);

      // Second call: spiritmender followup fails -> spawns pathseeker followup
      await orchestrationLoopLayerBroker({
        questId,
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: activeAgentsList,
        sessionIds,
        onFollowupCreated: mockOnFollowupCreated,
      });

      expect(mockOnFollowupCreated).toHaveBeenCalledTimes(2);

      // First: lawbringer -> spiritmender
      expect(mockOnFollowupCreated).toHaveBeenNthCalledWith(1, {
        followupWorkItemId: 'followup-lawbringer-chain-1-1700000000000',
        role: 'spiritmender',
        failedWorkItemId: 'lawbringer-chain-1',
      });

      // Second: spiritmender -> pathseeker, failedWorkItemId === first followup's id
      expect(mockOnFollowupCreated).toHaveBeenNthCalledWith(2, {
        followupWorkItemId: 'followup-followup-lawbringer-chain-1-1700000000000-1700000000000',
        role: 'pathseeker',
        failedWorkItemId: 'followup-lawbringer-chain-1-1700000000000',
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

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockSkipAllPending).toHaveBeenCalledTimes(0);
      expect(mockAddWorkItem).toHaveBeenCalledTimes(0);
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('[X4] crash retry limit', () => {
    it('VALID: {agent crashes 3 times} => respawns each time, incrementing crashRetries', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-crash-retry' });
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
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        crashRetries: 2,
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'work-item-crash-retry',
        sessionId: crashSessionId,
        followupDepth: 0,
        crashRetries: 3,
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(0);
    });

    it('VALID: {agent exceeds maxCrashRetries (4th crash)} => marks work item as failed', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-crash-limit' });
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
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        crashRetries: 3,
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
      expect(mockMarkFailed).toHaveBeenCalledWith({ workItemId: 'work-item-crash-limit' });
    });
  });

  describe('[X6] crash respawn no slot available', () => {
    it('VALID: {agent crashes, no slot available} => marks work item as failed', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-orphan' });
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
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        crashRetries: 0,
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub({
          getAvailableSlot: () => undefined,
        }),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
      expect(mockMarkFailed).toHaveBeenCalledWith({ workItemId: 'work-item-orphan' });
    });
  });

  describe('sessionId tracking', () => {
    it('VALID: {agent completes with sessionId} => sessionIds record contains workItemId to sessionId mapping', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-session' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const agentSessionId = SessionIdStub({ value: 'abc-session-123' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: jest.fn().mockResolvedValue(undefined),
      });

      const completeSignal = StreamSignalStub({ signal: 'complete' });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: agentSessionId,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const sessionIds = SlotManagerResultStub().sessionIds as never;

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(sessionIds).toStrictEqual({ 'work-item-session': 'abc-session-123' });
    });

    it('VALID: {agent completes with null sessionId} => sessionIds record remains empty for that workItemId', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-no-session' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: jest.fn().mockResolvedValue(undefined),
      });

      const completeSignal = StreamSignalStub({ signal: 'complete' });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: null as never,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const sessionIds = SlotManagerResultStub().sessionIds as never;

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds,
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect(sessionIds).toStrictEqual({});
    });

    it('VALID: {onWorkItemSessionId callback provided, agent has sessionId} => callback fires with workItemId and sessionId', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-callback' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const agentSessionId = SessionIdStub({ value: 'callback-session-456' });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: jest.fn().mockResolvedValue(undefined),
      });

      const completeSignal = StreamSignalStub({ signal: 'complete' });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: agentSessionId,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const sessionIds = SlotManagerResultStub().sessionIds as never;
      const onWorkItemSessionId = jest.fn();

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds,
        onWorkItemSessionId,
      });

      expect(sessionIds).toStrictEqual({ 'work-item-callback': 'callback-session-456' });
    });

    it('VALID: {crash retry, agent has sessionId on retry} => sessionIds record contains latest sessionId', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-crash-session' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const crashSessionId = SessionIdStub({ value: 'crash-session-789' });
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
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        crashRetries: 0,
        promise: Promise.resolve(agentResult),
      });

      const startPath = FilePathStub({ value: '/project/src' });
      const sessionIds = SlotManagerResultStub().sessionIds as never;

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds,
      });

      const continueResult = result as Extract<
        Awaited<ReturnType<typeof orchestrationLoopLayerBroker>>,
        { done: false }
      >;
      const [firstAgent] = continueResult.activeAgents;
      const { promise: agentPromise, ...agentRest } = firstAgent!;

      expect(agentPromise).toBeInstanceOf(Promise);
      expect(agentRest).toStrictEqual({
        slotIndex: SlotIndexStub({ value: 0 }),
        workItemId: 'work-item-crash-session',
        sessionId: crashSessionId,
        followupDepth: 0,
        crashRetries: 1,
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(0);
      expect(sessionIds).toStrictEqual({ 'work-item-crash-session': 'crash-session-789' });
    });
  });

  describe('ABORT (pause during slot manager agents)', () => {
    it('VALID: {codeweaver crashed while aborted} => work tracker untouched, agent removed from active list', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-aborted' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const crashSessionId = SessionIdStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn();
      const mockSkipAllPending = jest.fn();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: mockMarkStarted,
        markCompleted: mockMarkCompleted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: crashSessionId,
        exitCode: ExitCodeStub({ value: 1 }),
        crashed: true as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const abortController = new AbortController();
      abortController.abort();

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath: FilePathStub({ value: '/project/src' }),
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        abortSignal: abortController.signal,
      });

      // Work tracker must be completely untouched — item stays in_progress for pause responder to reset
      expect.assertions(2);
      expect(
        [
          mockMarkStarted,
          mockMarkCompleted,
          mockMarkFailed,
          mockAddWorkItem,
          mockSkipAllPending,
        ].every((fn) => fn.mock.calls.length === 0),
      ).toBe(true);
      // Agent must be removed from active list (it completed, just not processed)
      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });

    it('VALID: {lawbringer signal-failed while aborted} => work tracker untouched, agent removed', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-law-aborted' });
      const lawbringerWorkUnit = LawbringerWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn();
      const mockSkipAllPending = jest.fn();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => lawbringerWorkUnit,
        markStarted: mockMarkStarted,
        markCompleted: mockMarkCompleted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failSignal = StreamSignalStub({ signal: 'failed', summary: 'lint error' as never });
      const agentResult = AgentSpawnStreamingResultStub({
        exitCode: ExitCodeStub({ value: 0 }),
        crashed: false as never,

        signal: failSignal,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const abortController = new AbortController();
      abortController.abort();

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath: FilePathStub({ value: '/project/src' }),
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        abortSignal: abortController.signal,
      });

      // Work tracker must be completely untouched
      expect.assertions(2);
      expect(
        [
          mockMarkStarted,
          mockMarkCompleted,
          mockMarkFailed,
          mockAddWorkItem,
          mockSkipAllPending,
        ].every((fn) => fn.mock.calls.length === 0),
      ).toBe(true);
      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });

    it('VALID: {spiritmender crashed while aborted} => work tracker untouched, agent removed', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-spirit-aborted' });
      const spiritmenderWorkUnit = SpiritmenderWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn();
      const mockSkipAllPending = jest.fn();
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => spiritmenderWorkUnit,
        markStarted: mockMarkStarted,
        markCompleted: mockMarkCompleted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const agentResult = AgentSpawnStreamingResultStub({
        exitCode: ExitCodeStub({ value: 1 }),
        crashed: true as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const abortController = new AbortController();
      abortController.abort();

      const result = await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath: FilePathStub({ value: '/project/src' }),
        slotCount: SlotCountStub({ value: 2 }),

        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        abortSignal: abortController.signal,
      });

      // Work tracker must be completely untouched
      expect.assertions(2);
      expect(
        [
          mockMarkStarted,
          mockMarkCompleted,
          mockMarkFailed,
          mockAddWorkItem,
          mockSkipAllPending,
        ].every((fn) => fn.mock.calls.length === 0),
      ).toBe(true);
      expect(result).toStrictEqual({ done: false, activeAgents: [] });
    });
  });

  describe('onWorkItemSummary callback', () => {
    it('VALID: {agent signals complete with summary} => invokes onWorkItemSummary with workItemId and summary', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        markCompleted: mockMarkCompleted,
      });

      const completeSignal = StreamSignalStub({
        signal: 'complete',
        summary: 'Implemented auth with tests' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const onWorkItemSummary = jest.fn();
      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        onWorkItemSummary,
      });

      expect(onWorkItemSummary).toHaveBeenCalledTimes(1);
      expect(onWorkItemSummary).toHaveBeenCalledWith({
        workItemId: 'work-item-1',
        summary: 'Implemented auth with tests',
      });
    });

    it('VALID: {agent signals complete without summary} => does not invoke onWorkItemSummary', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        markCompleted: mockMarkCompleted,
      });

      const completeSignal = StreamSignalStub({ signal: 'complete', summary: undefined });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const onWorkItemSummary = jest.fn();
      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        onWorkItemSummary,
      });

      expect(onWorkItemSummary).toHaveBeenCalledTimes(0);
    });

    it('VALID: {agent signals failed with summary} => invokes onWorkItemSummary before failure routing', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'codeweaver-work-1' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'BLOCKED: type errors' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const onWorkItemSummary = jest.fn();
      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        maxFollowupDepth: FollowupDepthStub({ value: 3 }),
        onWorkItemSummary,
      });

      expect(onWorkItemSummary).toHaveBeenCalledTimes(1);
      expect(onWorkItemSummary).toHaveBeenCalledWith({
        workItemId: 'codeweaver-work-1',
        summary: 'BLOCKED: type errors',
      });
    });
  });

  describe('onWorkItemSignal callback', () => {
    it('VALID: {agent signals complete} => invokes onWorkItemSignal with signal=complete', async () => {
      orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        markCompleted: mockMarkCompleted,
      });

      const completeSignal = StreamSignalStub({ signal: 'complete', summary: undefined });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 0 }),
        signal: completeSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const onWorkItemSignal = jest.fn();
      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        onWorkItemSignal,
      });

      expect(onWorkItemSignal).toHaveBeenCalledTimes(1);
      expect(onWorkItemSignal).toHaveBeenCalledWith({
        workItemId: 'work-item-1',
        signal: 'complete',
      });
    });

    it('VALID: {agent signals failed} => invokes onWorkItemSignal with signal=failed', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'codeweaver-work-2' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({ signal: 'failed', summary: undefined });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
      });

      const activeAgent = ActiveAgentStub({
        workItemId,
        sessionId: null,
        followupDepth: FollowupDepthStub({ value: 0 }),
        promise: Promise.resolve(agentResult),
      });

      const onWorkItemSignal = jest.fn();
      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
        maxFollowupDepth: FollowupDepthStub({ value: 3 }),
        onWorkItemSignal,
      });

      expect(onWorkItemSignal).toHaveBeenCalledTimes(1);
      expect(onWorkItemSignal).toHaveBeenCalledWith({
        workItemId: 'codeweaver-work-2',
        signal: 'failed',
      });
    });
  });

  describe('concurrent dispatch within single iteration', () => {
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

    it('VALID: {2 ready items, slotCount=3, no active agents} => markStarted called for BOTH in a single invocation', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupSpawnAutoLines({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      const workItemId1 = WorkItemIdStub({ value: 'work-item-0' });
      const workItemId2 = WorkItemIdStub({ value: 'work-item-1' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const startedIds = new Set<ReturnType<typeof WorkItemIdStub>>();
      const mockMarkStarted = jest
        .fn()
        .mockImplementation(({ workItemId }: { workItemId: ReturnType<typeof WorkItemIdStub> }) => {
          startedIds.add(workItemId);
          return undefined;
        });
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [workItemId1, workItemId2].filter((id) => !startedIds.has(id)),
        getIncompleteIds: () => [workItemId1, workItemId2],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: mockMarkStarted,
      });

      const slotIndex0 = SlotIndexStub({ value: 0 });
      const slotIndex1 = SlotIndexStub({ value: 1 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: jest
          .fn()
          .mockReturnValueOnce(slotIndex0)
          .mockReturnValueOnce(slotIndex1)
          .mockReturnValue(undefined),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations,
        activeAgents: [],
        sessionIds: {},
      });

      const calledIds = mockMarkStarted.mock.calls.map(
        (call: readonly [{ workItemId: ReturnType<typeof WorkItemIdStub> }]) => call[0].workItemId,
      );

      expect(calledIds).toStrictEqual([workItemId1, workItemId2]);
    });

    it('VALID: {1 ready item, slotCount=3, no active agents} => markStarted called exactly once (regression guard)', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupSpawnAutoLines({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const startedIds = new Set<ReturnType<typeof WorkItemIdStub>>();
      const mockMarkStarted = jest
        .fn()
        .mockImplementation(
          ({ workItemId: id }: { workItemId: ReturnType<typeof WorkItemIdStub> }) => {
            startedIds.add(id);
            return undefined;
          },
        );
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () => [workItemId].filter((id) => !startedIds.has(id)),
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: mockMarkStarted,
      });

      const slotIndex0 = SlotIndexStub({ value: 0 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: jest.fn().mockReturnValueOnce(slotIndex0).mockReturnValue(undefined),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 3 }),
        slotOperations,
        activeAgents: [],
        sessionIds: {},
      });

      const calledIds = mockMarkStarted.mock.calls.map(
        (call: readonly [{ workItemId: ReturnType<typeof WorkItemIdStub> }]) => call[0].workItemId,
      );

      expect(calledIds).toStrictEqual([workItemId]);
    });

    it('VALID: {3 ready items, slotCount=2, no active agents} => markStarted called only twice (slot cap respected)', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupSpawnAutoLines({
        lines: [COMPLETE_SIGNAL_LINE],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      const workItemId1 = WorkItemIdStub({ value: 'work-item-0' });
      const workItemId2 = WorkItemIdStub({ value: 'work-item-1' });
      const workItemId3 = WorkItemIdStub({ value: 'work-item-2' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const startedIds = new Set<ReturnType<typeof WorkItemIdStub>>();
      const mockMarkStarted = jest
        .fn()
        .mockImplementation(
          ({ workItemId: id }: { workItemId: ReturnType<typeof WorkItemIdStub> }) => {
            startedIds.add(id);
            return undefined;
          },
        );
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        isAllTerminal: () => false,
        getReadyWorkIds: () =>
          [workItemId1, workItemId2, workItemId3].filter((id) => !startedIds.has(id)),
        getIncompleteIds: () => [workItemId1, workItemId2, workItemId3],
        getFailedIds: () => [],
        getWorkUnit: () => codeweaverWorkUnit,
        markStarted: mockMarkStarted,
      });

      const slotIndex0 = SlotIndexStub({ value: 0 });
      const slotIndex1 = SlotIndexStub({ value: 1 });
      const slotOperations = SlotOperationsStub({
        getAvailableSlot: jest
          .fn()
          .mockReturnValueOnce(slotIndex0)
          .mockReturnValueOnce(slotIndex1)
          .mockReturnValue(undefined),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      await orchestrationLoopLayerBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        workTracker,
        startPath,
        slotCount: SlotCountStub({ value: 2 }),
        slotOperations,
        activeAgents: [],
        sessionIds: {},
      });

      const calledIds = mockMarkStarted.mock.calls.map(
        (call: readonly [{ workItemId: ReturnType<typeof WorkItemIdStub> }]) => call[0].workItemId,
      );

      expect(calledIds).toStrictEqual([workItemId1, workItemId2]);
    });
  });

  describe('spawn_role path - smoketest short-circuit', () => {
    it('VALID: {smoketest codeweaver signals failed} => marks completed and skips drain/transition/spawn', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'smoketest-codeweaver-1' });
      const smoketestCodeweaverWorkUnit = CodeweaverWorkUnitStub({
        smoketestPromptOverride: 'emit failed signal' as never,
      });
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const mockAddWorkItem = jest.fn().mockReturnValue(undefined);
      const mockSkipAllPending = jest.fn().mockReturnValue(undefined);
      const workTracker = WorkTrackerStub({
        isAllComplete: () => false,
        getReadyWorkIds: () => [],
        getIncompleteIds: () => [workItemId],
        getFailedIds: () => [],
        getWorkUnit: () => smoketestCodeweaverWorkUnit,
        markCompleted: mockMarkCompleted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Smoketest expected failure' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
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
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect(result).toStrictEqual({ done: false, activeAgents: [] });
      expect({
        markCompleted: mockMarkCompleted.mock.calls.length,
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
        questModifyCalls: proxy.getQuestModifyCalls().length,
      }).toStrictEqual({
        markCompleted: 1,
        skipAllPending: 0,
        addWorkItem: 0,
        questModifyCalls: 0,
      });
      expect(mockMarkCompleted.mock.calls[0]![0]).toStrictEqual({ workItemId });
    });

    it('VALID: {non-smoketest codeweaver signals failed} => still drains, transitions seek_walk, and spawns pathseeker', async () => {
      const proxy = orchestrationLoopLayerBrokerProxy();
      proxy.setupDateNow({ timestamp: 1700000000000 });

      const workItemId = WorkItemIdStub({ value: 'codeweaver-regression-1' });
      const codeweaverWorkUnit = CodeweaverWorkUnitStub();
      const mockMarkStarted = jest.fn().mockResolvedValue(undefined);
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
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
        markCompleted: mockMarkCompleted,
        markFailed: mockMarkFailed,
        addWorkItem: mockAddWorkItem,
        skipAllPending: mockSkipAllPending,
      });

      const failedSignal = StreamSignalStub({
        signal: 'failed',
        summary: 'Real build failure' as never,
      });
      const agentResult = AgentSpawnStreamingResultStub({
        sessionId: SessionIdStub(),
        exitCode: ExitCodeStub({ value: 1 }),
        signal: failedSignal,
        crashed: false as never,
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
        slotOperations: SlotOperationsStub(),
        activeAgents: [activeAgent],
        sessionIds: {},
      });

      expect({
        markCompleted: mockMarkCompleted.mock.calls.length,
        skipAllPending: mockSkipAllPending.mock.calls.length,
        addWorkItem: mockAddWorkItem.mock.calls.length,
      }).toStrictEqual({
        markCompleted: 0,
        skipAllPending: 1,
        addWorkItem: 1,
      });
      expect(proxy.getQuestModifyCalls()).toStrictEqual([
        { input: { questId: QuestIdStub({ value: 'add-auth' }), status: 'seek_walk' } },
      ]);
    });
  });
});
