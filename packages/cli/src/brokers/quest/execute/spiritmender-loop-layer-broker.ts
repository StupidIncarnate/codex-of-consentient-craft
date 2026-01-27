/**
 * PURPOSE: Executes Ward -> Spiritmender -> Ward loop until ward passes or max iterations
 *
 * USAGE:
 * await spiritmenderLoopLayerBroker({projectPath, questFilePath, slotCount, timeoutMs, slotOperations, maxIterations});
 * // Returns: SlotManagerResult when ward passes or needs user input
 */

import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';

import type { MaxIterations } from '../../../contracts/max-iterations/max-iterations-contract';
import { maxIterationsContract } from '../../../contracts/max-iterations/max-iterations-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { wardRunBroker } from '../../ward/run/ward-run-broker';
import { spiritmenderPhaseLayerBroker } from './spiritmender-phase-layer-broker';

export const spiritmenderLoopLayerBroker = async ({
  projectPath,
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
  maxIterations,
  currentIteration,
}: {
  projectPath: AbsoluteFilePath;
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  maxIterations: MaxIterations;
  currentIteration?: MaxIterations;
}): Promise<SlotManagerResult> => {
  const iteration = currentIteration ?? maxIterationsContract.parse(1);
  const wardResult = await wardRunBroker({ projectPath });

  if (wardResult.success) {
    return { completed: true };
  }

  if (iteration >= maxIterations) {
    return { completed: true };
  }

  if (wardResult.errors.length === 0) {
    return { completed: true };
  }

  const spiritmenderResult = await spiritmenderPhaseLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
  });

  if (!spiritmenderResult.completed) {
    return spiritmenderResult;
  }

  const nextIteration = maxIterationsContract.parse(iteration + 1);

  return spiritmenderLoopLayerBroker({
    projectPath,
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    maxIterations,
    currentIteration: nextIteration,
  });
};
