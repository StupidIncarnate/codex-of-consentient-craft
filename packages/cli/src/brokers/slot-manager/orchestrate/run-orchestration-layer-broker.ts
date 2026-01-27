/**
 * PURPOSE: Recursively runs the orchestration loop until completion or user input needed
 *
 * USAGE:
 * const result = await runOrchestrationLayerBroker({questFilePath, slotCount, timeoutMs, slotOperations, activeAgents});
 * // Returns SlotManagerResult when orchestration completes or needs user input
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { ActiveAgent } from '../../../contracts/active-agent/active-agent-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { orchestrationLoopLayerBroker } from './orchestration-loop-layer-broker';

export const runOrchestrationLayerBroker = async ({
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
  activeAgents,
}: {
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  activeAgents: ActiveAgent[];
}): Promise<SlotManagerResult> => {
  const loopResult = await orchestrationLoopLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    activeAgents,
  });

  if (loopResult.done) {
    return loopResult.result;
  }

  return runOrchestrationLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    activeAgents: loopResult.activeAgents,
  });
};
