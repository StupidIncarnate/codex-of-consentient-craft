/**
 * PURPOSE: Executes the ward phase within the orchestration loop — runs ward with spiritmender retries
 *
 * USAGE:
 * await runWardLayerBroker({questFilePath, startPath, slotCount, slotOperations});
 * // Runs ward, retries up to 3 times with spiritmender fixes via slot manager
 */

import {
  errorMessageContract,
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { filePathsToSpiritmenderWorkUnitsTransformer } from '../../../transformers/file-paths-to-spiritmender-work-units/file-paths-to-spiritmender-work-units-transformer';
import { questStepsToAbsoluteFilePathsTransformer } from '../../../transformers/quest-steps-to-absolute-file-paths/quest-steps-to-absolute-file-paths-transformer';
import { wardOutputToFilePathsTransformer } from '../../../transformers/ward-output-to-file-paths/ward-output-to-file-paths-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questLoadBroker } from '../load/quest-load-broker';
import { spawnWardLayerBroker } from './spawn-ward-layer-broker';

const MAX_RETRIES = 3;
const MAX_FOLLOWUP_DEPTH = 3;

export const runWardLayerBroker = async ({
  questFilePath,
  startPath,
  slotCount,
  slotOperations,
  attempt = 1,
}: {
  questFilePath: FilePath;
  startPath: AbsoluteFilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  attempt?: number;
}): Promise<void> => {
  if (attempt > MAX_RETRIES) {
    throw new Error(`Ward phase failed after ${String(MAX_RETRIES)} retries`);
  }

  const { exitCode, wardResultJson } = await spawnWardLayerBroker({ startPath });

  if (exitCode === 0) {
    return;
  }

  let filePaths = wardResultJson ? wardOutputToFilePathsTransformer({ wardResultJson }) : [];

  if (filePaths.length === 0) {
    const quest = await questLoadBroker({ questFilePath });
    filePaths = questStepsToAbsoluteFilePathsTransformer({ steps: quest.steps });
  }

  if (filePaths.length === 0) {
    throw new Error('Ward phase failed and no file paths could be extracted for spiritmender');
  }

  const errors = wardResultJson ? [errorMessageContract.parse(wardResultJson)] : [];

  const spiritmenderWorkUnits = filePathsToSpiritmenderWorkUnitsTransformer({
    filePaths,
    errors,
  });

  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.ward.spiritmenderTimeoutMs);
  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits: spiritmenderWorkUnits });

  await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath: filePathContract.parse(startPath),
    maxFollowupDepth: followupDepthContract.parse(MAX_FOLLOWUP_DEPTH),
  });

  return runWardLayerBroker({
    questFilePath,
    startPath,
    slotCount,
    slotOperations,
    attempt: attempt + 1,
  });
};
