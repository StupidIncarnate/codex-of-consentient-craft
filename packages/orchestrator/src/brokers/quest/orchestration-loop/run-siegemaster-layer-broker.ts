/**
 * PURPOSE: Executes the siegemaster phase within the orchestration loop using slot manager for parallel execution
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, questFilePath, startPath});
 * // Runs siegemaster agents via slot manager, returns failedObservableIds from incomplete steps
 */

import type { FilePath, ObservableId, QuestId } from '@dungeonmaster/shared/contracts';

import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questLoadBroker } from '../load/quest-load-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const SIEGEMASTER_SLOT_COUNT = 3;
const SIEGEMASTER_TIMEOUT_MS = 300000;

export const runSiegemasterLayerBroker = async ({
  questFilePath,
  startPath,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
}): Promise<{ failedObservableIds: ObservableId[] }> => {
  const slotCount = slotCountContract.parse(SIEGEMASTER_SLOT_COUNT);
  const timeoutMs = timeoutMsContract.parse(SIEGEMASTER_TIMEOUT_MS);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  const quest = await questLoadBroker({ questFilePath });
  const pendingSteps = quest.steps.filter((step) => step.status !== 'complete');
  const workUnits = pendingSteps.map((step) =>
    buildWorkUnitForRoleTransformer({ role: 'siegemaster', step, quest }),
  );
  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  const result = await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath,
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
