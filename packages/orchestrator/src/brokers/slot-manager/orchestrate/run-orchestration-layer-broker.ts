/**
 * PURPOSE: Recursively runs the orchestration loop until completion or stuck state
 *
 * USAGE:
 * const result = await runOrchestrationLayerBroker({workTracker, slotCount, timeoutMs, slotOperations, activeAgents, startPath});
 * // Returns SlotManagerResult when orchestration completes or gets stuck
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { ActiveAgent } from '../../../contracts/active-agent/active-agent-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { FollowupDepth } from '../../../contracts/followup-depth/followup-depth-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import { orchestrationLoopLayerBroker } from './orchestration-loop-layer-broker';

export const runOrchestrationLayerBroker = async ({
  questId,
  workTracker,
  slotCount,
  timeoutMs,
  slotOperations,
  activeAgents,
  startPath,
  onAgentEntry,
  abortSignal,
  maxFollowupDepth,
}: {
  questId: QuestId;
  workTracker: WorkTracker;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  activeAgents: ActiveAgent[];
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  abortSignal?: AbortSignal;
  maxFollowupDepth?: FollowupDepth;
}): Promise<SlotManagerResult> => {
  if (abortSignal?.aborted) {
    return {
      completed: false,
      incompleteIds: workTracker.getIncompleteIds(),
      failedIds: workTracker.getFailedIds(),
    };
  }

  const loopResult = await orchestrationLoopLayerBroker({
    questId,
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    activeAgents,
    startPath,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(maxFollowupDepth === undefined ? {} : { maxFollowupDepth }),
  });

  if (loopResult.done) {
    return loopResult.result;
  }

  return runOrchestrationLayerBroker({
    questId,
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    activeAgents: loopResult.activeAgents,
    startPath,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
    ...(maxFollowupDepth === undefined ? {} : { maxFollowupDepth }),
  });
};
