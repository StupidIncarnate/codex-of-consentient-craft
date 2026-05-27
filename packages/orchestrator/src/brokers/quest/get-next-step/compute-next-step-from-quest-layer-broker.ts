/**
 * PURPOSE: Layer helper for questGetNextStepBroker — given a single active quest, computes the NextStep response for it: run-ward when a ward item is ready (always alone), spawn-agents with the batch otherwise, or null when nothing is ready
 *
 * USAGE:
 * const step = computeNextStepFromQuestLayerBroker({ quest });
 * // Returns: NextStep | null — null means quest has only in_progress items right now.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { nextStepContract, type NextStep } from '../../../contracts/next-step/next-step-contract';
import { buildSpawnInstructionLayerBroker } from './build-spawn-instruction-layer-broker';
import { computeReadyWorkItemsLayerBroker } from './compute-ready-work-items-layer-broker';
import { selectBatchLayerBroker } from './select-batch-layer-broker';

const WARD_ROLE = 'ward';

export const computeNextStepFromQuestLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): NextStep | null => {
  const ready = computeReadyWorkItemsLayerBroker({ workItems: quest.workItems });
  if (ready.length === 0) {
    return null;
  }

  // run-ward is always alone. If any ward item is ready, return run-ward for the first one.
  const wardItem = ready.find((item) => item.role === WARD_ROLE);
  if (wardItem) {
    return nextStepContract.parse({
      type: 'run-ward',
      questId: quest.id,
      workItemId: wardItem.id,
      mode: wardItem.wardMode ?? 'changed',
    });
  }

  const batch = selectBatchLayerBroker({ ready });
  if (batch.length === 0) {
    return null;
  }

  const agents = batch.map((workItem) =>
    buildSpawnInstructionLayerBroker({ questId: quest.id, workItem }),
  );
  return nextStepContract.parse({ type: 'spawn-agents', agents });
};
