/**
 * PURPOSE: Runs the siegemaster phase using the slot manager for parallel observable verification
 *
 * USAGE:
 * const result = await siegemasterPhaseLayerBroker({questId, questFilePath, startPath, onPhaseChange});
 * // Returns SiegemasterPhaseResult with failedObservableIds from incomplete steps
 */

import type { FilePath, ObservableId, QuestId } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import type { SiegemasterPhaseResult } from '../../../contracts/siegemaster-phase-result/siegemaster-phase-result-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const SIEGEMASTER_SLOT_COUNT = 3;
const SIEGEMASTER_TIMEOUT_MS = 300000;

export const siegemasterPhaseLayerBroker = async ({
  questFilePath,
  startPath,
  onPhaseChange,
  abortSignal,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onPhaseChange: ({ phase }: { phase: OrchestrationPhase }) => void;
  abortSignal?: AbortSignal;
}): Promise<SiegemasterPhaseResult> => {
  if (abortSignal?.aborted) {
    return { failedObservableIds: [] };
  }

  onPhaseChange({ phase: 'siegemaster' });

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
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });

  if (abortSignal?.aborted) {
    return { failedObservableIds: [] };
  }

  if (result.completed) {
    return { failedObservableIds: [] };
  }

  const failedObservableIds: ObservableId[] = result.incompleteSteps.flatMap(
    (step) => step.observablesSatisfied,
  );

  return { failedObservableIds };
};
