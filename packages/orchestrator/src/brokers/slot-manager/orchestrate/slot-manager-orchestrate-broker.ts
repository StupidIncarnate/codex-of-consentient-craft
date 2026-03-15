/**
 * PURPOSE: Orchestrates N concurrent agent slots to execute work items in parallel
 *
 * USAGE:
 * const result = await slotManagerOrchestrateBroker({workTracker, slotCount, timeoutMs, slotOperations, startPath});
 * // Returns { completed: true } when all work items done
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { FollowupDepth } from '../../../contracts/followup-depth/followup-depth-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import { runOrchestrationLayerBroker } from './run-orchestration-layer-broker';

export const slotManagerOrchestrateBroker = async ({
  workTracker,
  slotCount,
  timeoutMs,
  slotOperations,
  startPath,
  onAgentEntry,
  abortSignal,
  maxFollowupDepth,
}: {
  workTracker: WorkTracker;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  abortSignal?: AbortSignal;
  maxFollowupDepth?: FollowupDepth;
}): Promise<SlotManagerResult> => {
  const result = await runOrchestrationLayerBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    activeAgents: [],
    startPath,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
    ...(maxFollowupDepth === undefined ? {} : { maxFollowupDepth }),
  });
  return result;
};
