/**
 * PURPOSE: Executes the codeweaver phase within the orchestration loop using slot manager for parallel execution
 *
 * USAGE:
 * await runCodeweaverLayerBroker({questId, questFilePath, startPath});
 * // Runs codeweaver agents with 3 concurrent slots, throws on incomplete steps
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questLoadBroker } from '../load/quest-load-broker';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const CODEWEAVER_SLOT_COUNT = 3;
const CODEWEAVER_TIMEOUT_MS = 600000;

export const runCodeweaverLayerBroker = async ({
  questFilePath,
  startPath,
  onAgentEntry,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  const slotCount = slotCountContract.parse(CODEWEAVER_SLOT_COUNT);
  const timeoutMs = timeoutMsContract.parse(CODEWEAVER_TIMEOUT_MS);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

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
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
  });

  if (!result.completed) {
    const incompleteCount = result.incompleteIds.length;
    throw new Error(`Codeweaver phase failed: ${String(incompleteCount)} incomplete work items`);
  }
};
