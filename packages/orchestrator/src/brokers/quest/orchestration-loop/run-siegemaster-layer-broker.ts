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
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
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

  const result = await slotManagerOrchestrateBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    role: 'siegemaster',
    startPath,
  });

  if (result.completed) {
    return { failedObservableIds: [] };
  }

  const failedObservableIds = result.incompleteSteps.flatMap((step) => step.observablesSatisfied);

  return { failedObservableIds };
};
