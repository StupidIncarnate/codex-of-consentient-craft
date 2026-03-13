/**
 * PURPOSE: Executes the ward phase within the orchestration loop — runs ward with spiritmender retries
 *
 * USAGE:
 * await runWardLayerBroker({questFilePath, startPath});
 * // Runs ward, retries up to 3 times with spiritmender fixes on failure
 */

import {
  errorMessageContract,
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { maxConcurrentContract } from '../../../contracts/max-concurrent/max-concurrent-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { filePathsToSpiritmenderWorkUnitsTransformer } from '../../../transformers/file-paths-to-spiritmender-work-units/file-paths-to-spiritmender-work-units-transformer';
import { questStepsToAbsoluteFilePathsTransformer } from '../../../transformers/quest-steps-to-absolute-file-paths/quest-steps-to-absolute-file-paths-transformer';
import { wardOutputToFilePathsTransformer } from '../../../transformers/ward-output-to-file-paths/ward-output-to-file-paths-transformer';
import { agentParallelRunnerBroker } from '../../agent/parallel-runner/agent-parallel-runner-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { spawnWardLayerBroker } from './spawn-ward-layer-broker';

const MAX_RETRIES = 3;
const SPIRITMENDER_TIMEOUT_MS = 600000;
const SPIRITMENDER_MAX_CONCURRENT = 3;

export const runWardLayerBroker = async ({
  questFilePath,
  startPath,
  attempt = 1,
}: {
  questFilePath: FilePath;
  startPath: AbsoluteFilePath;
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

  const workUnits = filePathsToSpiritmenderWorkUnitsTransformer({
    filePaths,
    errors,
  });

  await agentParallelRunnerBroker({
    workUnits,
    maxConcurrent: maxConcurrentContract.parse(SPIRITMENDER_MAX_CONCURRENT),
    timeoutMs: timeoutMsContract.parse(SPIRITMENDER_TIMEOUT_MS),
    startPath: filePathContract.parse(startPath),
  });

  return runWardLayerBroker({
    questFilePath,
    startPath,
    attempt: attempt + 1,
  });
};
