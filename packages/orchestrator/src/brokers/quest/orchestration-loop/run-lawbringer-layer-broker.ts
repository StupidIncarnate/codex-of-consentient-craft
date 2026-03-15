/**
 * PURPOSE: Executes the lawbringer phase within the orchestration loop using slot manager for parallel execution
 *
 * USAGE:
 * await runLawbringerLayerBroker({questFilePath, startPath, slotCount, slotOperations});
 * // Spawns lawbringer agents for each file pair via slot manager
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const LAWBRINGER_TIMEOUT_MS = 300000;

export const runLawbringerLayerBroker = async ({
  questFilePath,
  startPath,
  slotCount,
  slotOperations,
}: {
  questFilePath: FilePath;
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
}): Promise<void> => {
  const timeoutMs = timeoutMsContract.parse(LAWBRINGER_TIMEOUT_MS);

  await slotManagerOrchestrateBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    role: 'lawbringer',
    startPath,
  });
};
