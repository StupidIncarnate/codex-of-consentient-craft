/**
 * PURPOSE: Executes a single iteration of the orchestration loop using WorkTracker abstraction
 *
 * USAGE:
 * const result = await orchestrationLoopLayerBroker({workTracker, slotCount, timeoutMs, slotOperations, activeAgents, startPath});
 * // Returns { done: true, result } when complete, or { done: false, activeAgents } to continue
 */

import type { FilePath, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import type { ActiveAgent } from '../../../contracts/active-agent/active-agent-contract';
import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import type { FollowupDepth } from '../../../contracts/followup-depth/followup-depth-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workItemIdContract } from '../../../contracts/work-item-id/work-item-id-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { handleSignalLayerBroker } from './handle-signal-layer-broker';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';

const ZERO_DEPTH = followupDepthContract.parse(0);
const ZERO_CRASH_RETRIES = 0 as ActiveAgent['crashRetries'];
const MAX_CRASH_RETRIES = 3;

type LoopResult =
  | { done: true; result: SlotManagerResult }
  | { done: false; activeAgents: ActiveAgent[] };

export const orchestrationLoopLayerBroker = async ({
  questId,
  workTracker,
  slotCount,
  timeoutMs,
  slotOperations,
  activeAgents,
  startPath,
  onAgentEntry,
  onWorkItemSessionId,
  maxFollowupDepth,
  sessionIds,
}: {
  questId: QuestId;
  workTracker: WorkTracker;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  activeAgents: ActiveAgent[];
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  onWorkItemSessionId?: (params: { workItemId: WorkItemId; sessionId: SessionId }) => void;
  maxFollowupDepth?: FollowupDepth;
  sessionIds: Record<WorkItemId, SessionId>;
}): Promise<LoopResult> => {
  if (workTracker.isAllTerminal() && activeAgents.length === 0) {
    const failedIds = workTracker.getFailedIds();
    if (failedIds.length > 0) {
      const incompleteIds = workTracker.getIncompleteIds();
      return { done: true, result: { completed: false, incompleteIds, failedIds, sessionIds } };
    }
    return { done: true, result: { completed: true, sessionIds } };
  }

  const readyIds = workTracker.getReadyWorkIds();

  const availableSlotIndex = slotOperations.getAvailableSlot({ slotCount });
  if (availableSlotIndex !== undefined && readyIds.length > 0) {
    const [workItemId] = readyIds;
    if (workItemId) {
      await workTracker.markStarted({ workItemId });

      const workUnit = workTracker.getWorkUnit({ workItemId });

      const agentPromise = spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
        startPath,
        ...(onAgentEntry === undefined
          ? {}
          : {
              onLine: ({ line }: { line: string }) => {
                onAgentEntry({ slotIndex: availableSlotIndex, entry: { raw: line } });
              },
            }),
        ...(onWorkItemSessionId === undefined
          ? {}
          : {
              onSessionId: ({ sessionId }: { sessionId: SessionId }) => {
                Reflect.set(sessionIds, workItemId, sessionId);
                onWorkItemSessionId({ workItemId, sessionId });
              },
            }),
      });

      activeAgents.push({
        slotIndex: availableSlotIndex,
        workItemId,
        sessionId: null,
        followupDepth: ZERO_DEPTH,
        crashRetries: ZERO_CRASH_RETRIES,
        promise: agentPromise,
      });
    }
  }

  if (activeAgents.length === 0 && readyIds.length === 0) {
    const incompleteIds = workTracker.getIncompleteIds();
    const failedIds = workTracker.getFailedIds();
    return { done: true, result: { completed: false, incompleteIds, failedIds, sessionIds } };
  }

  if (activeAgents.length === 0) {
    return { done: true, result: { completed: true, sessionIds } };
  }

  const raceResult = await Promise.race(
    activeAgents.map(async (agent) => ({
      agent,
      result: await agent.promise,
    })),
  );

  const { agent: completedAgent, result } = raceResult;

  const agentIndex = activeAgents.findIndex((a) => a.slotIndex === completedAgent.slotIndex);
  activeAgents.splice(agentIndex, 1);

  slotOperations.releaseSlot({ slotIndex: completedAgent.slotIndex });

  if (result.sessionId !== null) {
    Reflect.set(sessionIds, completedAgent.workItemId, result.sessionId);
  }

  if (result.crashed || result.timedOut) {
    const nextCrashRetries = (completedAgent.crashRetries + 1) as ActiveAgent['crashRetries'];

    if (nextCrashRetries > MAX_CRASH_RETRIES) {
      await workTracker.markFailed({ workItemId: completedAgent.workItemId });
      return { done: false, activeAgents };
    }

    const workUnit = workTracker.getWorkUnit({ workItemId: completedAgent.workItemId });

    const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
    if (newSlotIndex === undefined) {
      await workTracker.markFailed({ workItemId: completedAgent.workItemId });
    } else {
      const agentPromise = spawnAgentLayerBroker({
        workUnit,
        timeoutMs,
        startPath,
        ...(result.sessionId === null ? {} : { resumeSessionId: result.sessionId }),
        ...(onAgentEntry === undefined
          ? {}
          : {
              onLine: ({ line }: { line: string }) => {
                onAgentEntry({ slotIndex: newSlotIndex, entry: { raw: line } });
              },
            }),
        ...(onWorkItemSessionId === undefined
          ? {}
          : {
              onSessionId: ({ sessionId }: { sessionId: SessionId }) => {
                Reflect.set(sessionIds, completedAgent.workItemId, sessionId);
                onWorkItemSessionId({ workItemId: completedAgent.workItemId, sessionId });
              },
            }),
      });

      activeAgents.push({
        slotIndex: newSlotIndex,
        workItemId: completedAgent.workItemId,
        sessionId: result.sessionId,
        followupDepth: ZERO_DEPTH,
        crashRetries: nextCrashRetries,
        promise: agentPromise,
      });
    }
    return { done: false, activeAgents };
  }

  if (result.signal === null) {
    await workTracker.markFailed({ workItemId: completedAgent.workItemId });
    return { done: false, activeAgents };
  }

  const workUnit = workTracker.getWorkUnit({ workItemId: completedAgent.workItemId });

  const signalResult = await handleSignalLayerBroker({
    signal: result.signal,
    workItemId: completedAgent.workItemId,
    workTracker,
    role: workUnit.role,
  });

  switch (signalResult.action) {
    case 'continue': {
      if (completedAgent.followupDepth > 0 && result.signal.signal === 'complete') {
        await workTracker.markStarted({ workItemId: completedAgent.workItemId });
      }
      return { done: false, activeAgents };
    }

    case 'spawn_role': {
      const isWithinDepthLimit =
        maxFollowupDepth === undefined || completedAgent.followupDepth < maxFollowupDepth;

      if (isWithinDepthLimit) {
        // Drain: skip all pending items so no new work spawns while active agents finish
        workTracker.skipAllPending();

        const followupWorkUnit =
          signalResult.targetRole === 'spiritmender'
            ? workUnitContract.parse({
                role: 'spiritmender',
                filePaths: 'filePaths' in workUnit ? workUnit.filePaths : [],
                ...(signalResult.summary === undefined ? {} : { errors: [signalResult.summary] }),
              })
            : workUnitContract.parse({
                role: signalResult.targetRole,
                questId,
                ...(signalResult.summary === undefined
                  ? {}
                  : { failureContext: signalResult.summary }),
              });

        const newWorkItemId = workItemIdContract.parse(
          `followup-${completedAgent.workItemId}-${String(Date.now())}`,
        );
        workTracker.addWorkItem({ workItemId: newWorkItemId, workUnit: followupWorkUnit });

        const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
        if (newSlotIndex !== undefined) {
          await workTracker.markStarted({ workItemId: newWorkItemId });

          const agentPromise = spawnAgentLayerBroker({
            workUnit: followupWorkUnit,
            timeoutMs,
            startPath,
            ...(onAgentEntry === undefined
              ? {}
              : {
                  onLine: ({ line }: { line: string }) => {
                    onAgentEntry({ slotIndex: newSlotIndex, entry: { raw: line } });
                  },
                }),
            ...(onWorkItemSessionId === undefined
              ? {}
              : {
                  onSessionId: ({ sessionId }: { sessionId: SessionId }) => {
                    Reflect.set(sessionIds, newWorkItemId, sessionId);
                    onWorkItemSessionId({ workItemId: newWorkItemId, sessionId });
                  },
                }),
          });

          const nextDepth = followupDepthContract.parse(completedAgent.followupDepth + 1);

          activeAgents.push({
            slotIndex: newSlotIndex,
            workItemId: newWorkItemId,
            sessionId: null,
            followupDepth: nextDepth,
            crashRetries: ZERO_CRASH_RETRIES,
            promise: agentPromise,
          });
        }
      } else {
        await workTracker.markFailed({ workItemId: completedAgent.workItemId });
      }
      return { done: false, activeAgents };
    }

    case 'bubble_to_user': {
      return { done: false, activeAgents };
    }

    default: {
      const exhaustiveCheck: never = signalResult;
      throw new Error(`Unhandled signal action: ${String(exhaustiveCheck)}`);
    }
  }
};
