/**
 * PURPOSE: Main orchestrator for quest execution pipeline
 *
 * USAGE:
 * await questExecuteBroker({projectPath, questFilePath, slotCount, timeoutMs, slotOperations, maxSpiritLoopIterations});
 * // Returns: SlotManagerResult when quest completes or needs user input
 *
 * Pipeline:
 * PathSeeker → Codeweavers → Ward → Siegemaster → Lawbringers → [Spiritmender loop] → Complete
 */

import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';

import type { MaxIterations } from '../../../contracts/max-iterations/max-iterations-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { codeweaverPhaseLayerBroker } from './codeweaver-phase-layer-broker';
import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { pathseekerPhaseLayerBroker } from './pathseeker-phase-layer-broker';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { spiritmenderLoopLayerBroker } from './spiritmender-loop-layer-broker';

export const questExecuteBroker = async ({
  projectPath,
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
  maxSpiritLoopIterations,
}: {
  projectPath: AbsoluteFilePath;
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  maxSpiritLoopIterations: MaxIterations;
}): Promise<SlotManagerResult> => {
  const pathseekerResult = await pathseekerPhaseLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
  });

  if (!pathseekerResult.completed) {
    return pathseekerResult;
  }

  const codeweaverResult = await codeweaverPhaseLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
  });

  if (!codeweaverResult.completed) {
    return codeweaverResult;
  }

  const siegemasterResult = await siegemasterPhaseLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
  });

  if (!siegemasterResult.completed) {
    return siegemasterResult;
  }

  const lawbringerResult = await lawbringerPhaseLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
  });

  if (!lawbringerResult.completed) {
    return lawbringerResult;
  }

  return spiritmenderLoopLayerBroker({
    projectPath,
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    maxIterations: maxSpiritLoopIterations,
  });
};
