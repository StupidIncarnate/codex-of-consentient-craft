/**
 * PURPOSE: Executes PathSeeker phase - single agent maps quest files
 *
 * USAGE:
 * await pathseekerPhaseLayerBroker({questFilePath, slotCount, timeoutMs, slotOperations});
 * // Returns: SlotManagerResult when PathSeeker completes or needs input
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

export const pathseekerPhaseLayerBroker = async ({
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
}: {
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
}): Promise<SlotManagerResult> =>
  slotManagerOrchestrateBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    role: 'pathseeker',
  });
