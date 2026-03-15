/**
 * PURPOSE: Runs the codeweaver phase using the slot manager for dependency-aware parallel execution
 *
 * USAGE:
 * await codeweaverPhaseLayerBroker({questId, questFilePath, onPhaseChange, slotCount, slotOperations});
 * // Executes codeweaver phase with shared slot pool, throws on incomplete steps
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questLoadBroker } from '../load/quest-load-broker';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';

export const codeweaverPhaseLayerBroker = async ({
  questId: _questId,
  questFilePath,
  startPath,
  slotCount,
  slotOperations,
  onPhaseChange,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  abortSignal?: AbortSignal;
}): Promise<void> => {
  if (abortSignal?.aborted) {
    return;
  }

  onPhaseChange({ phase: 'codeweaver' });

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
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });

  if (abortSignal?.aborted) {
    return;
  }

  if (!result.completed) {
    const incompleteCount = result.incompleteIds.length;
    throw new Error(`Codeweaver phase failed: ${String(incompleteCount)} incomplete work items`);
  }
};
