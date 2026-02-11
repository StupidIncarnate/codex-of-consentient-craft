/**
 * PURPOSE: Runs npm run ward:all as a gating verification step, spawns spiritmender agents on failure
 *
 * USAGE:
 * await wardPhaseLayerBroker({ questFilePath, startPath, onPhaseChange });
 * // Runs ward:all, retries up to 3 times with spiritmender fixes
 */

import {
  errorMessageContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { maxConcurrentContract } from '../../../contracts/max-concurrent/max-concurrent-contract';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
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

export const wardPhaseLayerBroker = async ({
  questFilePath,
  startPath,
  onPhaseChange,
  attempt = 1,
}: {
  questFilePath: FilePath;
  startPath: AbsoluteFilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  attempt?: number;
}): Promise<void> => {
  if (attempt === 1) {
    onPhaseChange({ phase: 'ward' });
  }

  if (attempt > MAX_RETRIES) {
    throw new Error(`Ward phase failed after ${String(MAX_RETRIES)} retries`);
  }

  const { exitCode, output } = await spawnWardLayerBroker({ startPath });

  if (exitCode === 0) {
    return;
  }

  let filePaths = wardOutputToFilePathsTransformer({ output });

  if (filePaths.length === 0) {
    const quest = await questLoadBroker({ questFilePath });
    filePaths = questStepsToAbsoluteFilePathsTransformer({ steps: quest.steps });
  }

  if (filePaths.length === 0) {
    throw new Error('Ward phase failed and no file paths could be extracted for spiritmender');
  }

  const errors = String(output).length > 0 ? [errorMessageContract.parse(String(output))] : [];

  const workUnits = filePathsToSpiritmenderWorkUnitsTransformer({
    filePaths,
    errors,
  });

  await agentParallelRunnerBroker({
    workUnits,
    maxConcurrent: maxConcurrentContract.parse(SPIRITMENDER_MAX_CONCURRENT),
    timeoutMs: timeoutMsContract.parse(SPIRITMENDER_TIMEOUT_MS),
  });

  return wardPhaseLayerBroker({
    questFilePath,
    startPath,
    onPhaseChange,
    attempt: attempt + 1,
  });
};
