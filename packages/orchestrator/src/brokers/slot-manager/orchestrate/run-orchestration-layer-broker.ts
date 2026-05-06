/**
 * PURPOSE: Recursively runs the orchestration loop until completion or stuck state
 *
 * USAGE:
 * const result = await runOrchestrationLayerBroker({workTracker, slotCount, slotOperations, activeAgents, startPath});
 * // Returns SlotManagerResult when orchestration completes or gets stuck
 */

import type { FilePath, GuildId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import type { ActiveAgent } from '../../../contracts/active-agent/active-agent-contract';
import type { FollowupDepth } from '../../../contracts/followup-depth/followup-depth-contract';
import type {
  OnFollowupCreatedCallback,
  OnSlotAgentEntryCallback,
  OnWorkItemSessionIdCallback,
  OnWorkItemSignalCallback,
  OnWorkItemSummaryCallback,
} from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import { orchestrationLoopLayerBroker } from './orchestration-loop-layer-broker';

export const runOrchestrationLayerBroker = async ({
  questId,
  workTracker,
  slotCount,
  slotOperations,
  activeAgents,
  startPath,
  guildId,
  onAgentEntry,
  onWorkItemSessionId,
  onFollowupCreated,
  onWorkItemSummary,
  onWorkItemSignal,
  abortSignal,
  maxFollowupDepth,
  sessionIds,
}: {
  questId: QuestId;
  workTracker: WorkTracker;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  activeAgents: ActiveAgent[];
  startPath: FilePath;
  guildId: GuildId;
  onAgentEntry?: OnSlotAgentEntryCallback;
  onWorkItemSessionId?: OnWorkItemSessionIdCallback;
  onFollowupCreated?: OnFollowupCreatedCallback;
  onWorkItemSummary?: OnWorkItemSummaryCallback;
  onWorkItemSignal?: OnWorkItemSignalCallback;
  abortSignal?: AbortSignal;
  maxFollowupDepth?: FollowupDepth;
  sessionIds: Record<WorkItemId, SessionId>;
}): Promise<SlotManagerResult> => {
  if (abortSignal?.aborted) {
    return {
      completed: false,
      incompleteIds: workTracker.getIncompleteIds(),
      failedIds: workTracker.getFailedIds(),
      sessionIds,
    };
  }

  const loopResult = await orchestrationLoopLayerBroker({
    questId,
    workTracker,
    slotCount,
    slotOperations,
    activeAgents,
    startPath,
    guildId,
    sessionIds,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(onWorkItemSessionId === undefined ? {} : { onWorkItemSessionId }),
    ...(onFollowupCreated === undefined ? {} : { onFollowupCreated }),
    ...(onWorkItemSummary === undefined ? {} : { onWorkItemSummary }),
    ...(onWorkItemSignal === undefined ? {} : { onWorkItemSignal }),
    ...(maxFollowupDepth === undefined ? {} : { maxFollowupDepth }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });

  if (loopResult.done) {
    return loopResult.result;
  }

  return runOrchestrationLayerBroker({
    questId,
    workTracker,
    slotCount,
    slotOperations,
    activeAgents: loopResult.activeAgents,
    startPath,
    guildId,
    sessionIds,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(onWorkItemSessionId === undefined ? {} : { onWorkItemSessionId }),
    ...(onFollowupCreated === undefined ? {} : { onFollowupCreated }),
    ...(onWorkItemSummary === undefined ? {} : { onWorkItemSummary }),
    ...(onWorkItemSignal === undefined ? {} : { onWorkItemSignal }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
    ...(maxFollowupDepth === undefined ? {} : { maxFollowupDepth }),
  });
};
