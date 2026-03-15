/**
 * PURPOSE: Executes a single iteration of the orchestration loop using WorkTracker abstraction
 *
 * USAGE:
 * const result = await orchestrationLoopLayerBroker({workTracker, slotCount, timeoutMs, slotOperations, activeAgents, startPath});
 * // Returns { done: true, result } when complete, or { done: false, activeAgents } to continue
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { ActiveAgent } from '../../../contracts/active-agent/active-agent-contract';
import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import type { FollowupDepth } from '../../../contracts/followup-depth/followup-depth-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import { buildContinuationContextTransformer } from '../../../transformers/build-continuation-context/build-continuation-context-transformer';
import { handleSignalLayerBroker } from './handle-signal-layer-broker';
import { spawnAgentLayerBroker } from './spawn-agent-layer-broker';

const ZERO_DEPTH = followupDepthContract.parse(0);

type LoopResult =
  | { done: true; result: SlotManagerResult }
  | { done: false; activeAgents: ActiveAgent[] };

export const orchestrationLoopLayerBroker = async ({
  workTracker,
  slotCount,
  timeoutMs,
  slotOperations,
  activeAgents,
  startPath,
  onAgentEntry,
  maxFollowupDepth,
}: {
  workTracker: WorkTracker;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  activeAgents: ActiveAgent[];
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  maxFollowupDepth?: FollowupDepth;
}): Promise<LoopResult> => {
  if (workTracker.isAllComplete() && activeAgents.length === 0) {
    return { done: true, result: { completed: true } };
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
      });

      activeAgents.push({
        slotIndex: availableSlotIndex,
        workItemId,
        sessionId: null,
        followupDepth: ZERO_DEPTH,
        promise: agentPromise,
      });
    }
  }

  if (activeAgents.length === 0 && readyIds.length === 0) {
    const incompleteIds = workTracker.getIncompleteIds();
    const failedIds = workTracker.getFailedIds();
    return { done: true, result: { completed: false, incompleteIds, failedIds } };
  }

  if (activeAgents.length === 0) {
    return { done: true, result: { completed: true } };
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

  if (result.crashed || result.timedOut) {
    const workUnit = workTracker.getWorkUnit({ workItemId: completedAgent.workItemId });

    const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
    if (newSlotIndex !== undefined) {
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
      });

      activeAgents.push({
        slotIndex: newSlotIndex,
        workItemId: completedAgent.workItemId,
        sessionId: result.sessionId,
        followupDepth: ZERO_DEPTH,
        promise: agentPromise,
      });
    }
    return { done: false, activeAgents };
  }

  if (result.signal === null) {
    await workTracker.markPartiallyCompleted({ workItemId: completedAgent.workItemId });
    return { done: false, activeAgents };
  }

  const signalResult = await handleSignalLayerBroker({
    signal: result.signal,
    workItemId: completedAgent.workItemId,
    workTracker,
  });

  switch (signalResult.action) {
    case 'continue': {
      if (completedAgent.followupDepth > 0 && result.signal.signal === 'complete') {
        await workTracker.markStarted({ workItemId: completedAgent.workItemId });
      }
      return { done: false, activeAgents };
    }

    case 'respawn': {
      const workUnit = workTracker.getWorkUnit({ workItemId: completedAgent.workItemId });

      const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
      if (newSlotIndex !== undefined) {
        const continuationContext = buildContinuationContextTransformer({
          ...(signalResult.continuationPoint === undefined
            ? {}
            : { continuationPoint: signalResult.continuationPoint }),
          capturedOutput: result.capturedOutput,
        });

        const agentPromise = spawnAgentLayerBroker({
          workUnit,
          timeoutMs,
          startPath,
          ...(result.sessionId === null ? {} : { resumeSessionId: result.sessionId }),
          ...(continuationContext === null ? {} : { continuationContext }),
          ...(onAgentEntry === undefined
            ? {}
            : {
                onLine: ({ line }: { line: string }) => {
                  onAgentEntry({ slotIndex: newSlotIndex, entry: { raw: line } });
                },
              }),
        });

        activeAgents.push({
          slotIndex: newSlotIndex,
          workItemId: completedAgent.workItemId,
          sessionId: result.sessionId,
          followupDepth: ZERO_DEPTH,
          promise: agentPromise,
        });
      }
      return { done: false, activeAgents };
    }

    case 'spawn_role': {
      const isWithinDepthLimit =
        maxFollowupDepth === undefined || completedAgent.followupDepth < maxFollowupDepth;

      if (isWithinDepthLimit) {
        const workUnit = workTracker.getWorkUnit({ workItemId: completedAgent.workItemId });

        const newSlotIndex = slotOperations.getAvailableSlot({ slotCount });
        if (newSlotIndex !== undefined) {
          const agentPromise = spawnAgentLayerBroker({
            workUnit,
            timeoutMs,
            startPath,
            ...(onAgentEntry === undefined
              ? {}
              : {
                  onLine: ({ line }: { line: string }) => {
                    onAgentEntry({ slotIndex: newSlotIndex, entry: { raw: line } });
                  },
                }),
          });

          const nextDepth = followupDepthContract.parse(completedAgent.followupDepth + 1);

          activeAgents.push({
            slotIndex: newSlotIndex,
            workItemId: completedAgent.workItemId,
            sessionId: null,
            followupDepth: nextDepth,
            promise: agentPromise,
          });
        }
      } else {
        await workTracker.markFailed({ workItemId: completedAgent.workItemId });
      }
      return { done: false, activeAgents };
    }

    default: {
      const exhaustiveCheck: never = signalResult;
      throw new Error(`Unhandled signal action: ${String(exhaustiveCheck)}`);
    }
  }
};
