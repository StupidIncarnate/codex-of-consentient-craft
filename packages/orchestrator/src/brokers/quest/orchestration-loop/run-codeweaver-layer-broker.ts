/**
 * PURPOSE: Executes the codeweaver phase within the orchestration loop using slot manager for parallel execution
 *
 * USAGE:
 * await runCodeweaverLayerBroker({questId, questFilePath, startPath, slotCount, slotOperations});
 * // Runs codeweaver agents with shared slot pool, throws on incomplete steps
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questLoadBroker } from '../load/quest-load-broker';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

export const runCodeweaverLayerBroker = async ({
  questFilePath,
  startPath,
  slotCount,
  slotOperations,
  onAgentEntry,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.codeweaver.timeoutMs);
  const maxFollowupDepth = followupDepthContract.parse(
    slotManagerStatics.codeweaver.maxFollowupDepth,
  );

  const quest = await questLoadBroker({ questFilePath });
  const pendingSteps = quest.steps.filter((step) => step.status !== 'complete');
  const workUnits = pendingSteps.map((step) =>
    buildWorkUnitForRoleTransformer({ role: 'codeweaver', step, quest }),
  );
  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  const result = await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath,
    maxFollowupDepth,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
  });

  if (!result.completed) {
    const incompleteCount = result.incompleteIds.length;
    throw new Error(`Codeweaver phase failed: ${String(incompleteCount)} incomplete work items`);
  }
};
