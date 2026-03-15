/**
 * PURPOSE: Executes the siegemaster phase within the orchestration loop using slot manager for parallel execution
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, questFilePath, startPath, slotCount, slotOperations});
 * // Runs siegemaster agents via slot manager, returns failedObservableIds from incomplete steps
 */

import type { FilePath, ObservableId, QuestId } from '@dungeonmaster/shared/contracts';

import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { failCountContract } from '../../../contracts/fail-count/fail-count-contract';
import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questLoadBroker } from '../load/quest-load-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

export const runSiegemasterLayerBroker = async ({
  questFilePath,
  startPath,
  slotCount,
  slotOperations,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
}): Promise<{ failedObservableIds: ObservableId[] }> => {
  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.siegemaster.timeoutMs);
  const maxRetries = failCountContract.parse(slotManagerStatics.siegemaster.maxRetries);
  const maxFollowupDepth = followupDepthContract.parse(
    slotManagerStatics.siegemaster.maxFollowupDepth,
  );

  const quest = await questLoadBroker({ questFilePath });
  const pendingSteps = quest.steps.filter((step) => step.status !== 'complete');
  const workUnits = pendingSteps.map((step) =>
    buildWorkUnitForRoleTransformer({ role: 'siegemaster', step, quest }),
  );
  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits, maxRetries });

  const result = await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath,
    maxFollowupDepth,
  });

  if (result.completed) {
    return { failedObservableIds: [] };
  }

  const failedObservableIds: ObservableId[] = result.incompleteIds.flatMap((workItemId) => {
    const workUnit = workTracker.getWorkUnit({ workItemId });
    if (workUnit.role !== 'siegemaster') {
      return [];
    }
    return workUnit.observables.map((observable) => observable.id);
  });

  return { failedObservableIds };
};
