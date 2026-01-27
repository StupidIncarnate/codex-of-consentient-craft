/**
 * PURPOSE: Delegates quest execution to the questExecuteBroker pipeline
 *
 * USAGE:
 * await agentOrchestrateBroker({projectPath, questFilePath, slotCount, timeoutMs, slotOperations, maxSpiritLoopIterations});
 * // Delegates to questExecuteBroker for full pipeline execution
 */

import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';

import type { MaxIterations } from '../../../contracts/max-iterations/max-iterations-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { questExecuteBroker } from '../../quest/execute/quest-execute-broker';

export const agentOrchestrateBroker = async ({
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
}): Promise<SlotManagerResult> =>
  questExecuteBroker({
    projectPath,
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    maxSpiritLoopIterations,
  });
