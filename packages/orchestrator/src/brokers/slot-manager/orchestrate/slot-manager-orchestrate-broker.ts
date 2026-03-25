/**
 * PURPOSE: Orchestrates N concurrent agent slots to execute work items in parallel
 *
 * USAGE:
 * const result = await slotManagerOrchestrateBroker({workTracker, slotCount, timeoutMs, slotOperations, startPath});
 * // Returns { completed: true } when all work items done
 */

import type { FilePath, QuestId, TimeoutMs } from '@dungeonmaster/shared/contracts';

import type { FollowupDepth } from '../../../contracts/followup-depth/followup-depth-contract';
import type {
  OnAgentEntryCallback,
  OnFollowupCreatedCallback,
  OnWorkItemSessionIdCallback,
} from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import { runOrchestrationLayerBroker } from './run-orchestration-layer-broker';

export const slotManagerOrchestrateBroker = async ({
  questId,
  workTracker,
  slotCount,
  timeoutMs,
  slotOperations,
  startPath,
  onAgentEntry,
  onWorkItemSessionId,
  onFollowupCreated,
  abortSignal,
  maxFollowupDepth,
}: {
  questId: QuestId;
  workTracker: WorkTracker;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  startPath: FilePath;
  onAgentEntry?: OnAgentEntryCallback;
  onWorkItemSessionId?: OnWorkItemSessionIdCallback;
  onFollowupCreated?: OnFollowupCreatedCallback;
  abortSignal?: AbortSignal;
  maxFollowupDepth?: FollowupDepth;
}): Promise<SlotManagerResult> => {
  const result = await runOrchestrationLayerBroker({
    questId,
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    activeAgents: [],
    startPath,
    sessionIds: {},
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(onWorkItemSessionId === undefined ? {} : { onWorkItemSessionId }),
    ...(onFollowupCreated === undefined ? {} : { onFollowupCreated }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
    ...(maxFollowupDepth === undefined ? {} : { maxFollowupDepth }),
  });
  return result;
};
