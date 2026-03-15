import { ExitCodeStub, FilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ActiveAgentStub } from '../../../contracts/active-agent/active-agent.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { FollowupDepthStub } from '../../../contracts/followup-depth/followup-depth.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
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
});
