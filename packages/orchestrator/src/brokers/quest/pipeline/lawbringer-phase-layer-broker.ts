/**
 * PURPOSE: Runs lawbringer agents to review code quality, one per file batch
 *
 * USAGE:
 * await lawbringerPhaseLayerBroker({
 *   questFilePath: FilePathStub({ value: '/quests/quest.json' }),
 *   onPhaseChange: ({ phase }) => {},
 * });
 * // Returns void after all file pairs are reviewed or skipped
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { maxConcurrentContract } from '../../../contracts/max-concurrent/max-concurrent-contract';
import type { MaxConcurrent } from '../../../contracts/max-concurrent/max-concurrent-contract';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { stepToFilePairsTransformer } from '../../../transformers/step-to-file-pairs/step-to-file-pairs-transformer';
import { agentParallelRunnerBroker } from '../../agent/parallel-runner/agent-parallel-runner-broker';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const MAX_RETRIES = 2;
const MAX_DISPATCH_DEPTH = 3;
const CONCURRENT_LIMIT = 3;
const TIMEOUT_MS = 300000;

export const lawbringerPhaseLayerBroker = async ({
  questFilePath,
  onPhaseChange,
  _retryState,
}: {
  questFilePath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  _retryState?: {
    failedWorkUnits: WorkUnit[];
    lastResults: AgentSpawnStreamingResult[];
    maxConcurrent: MaxConcurrent;
    timeoutMs: TimeoutMs;
    retryCount: number;
    dispatchDepth: number;
  };
}): Promise<void> => {
  if (_retryState !== undefined) {
    const { failedWorkUnits, lastResults, maxConcurrent, timeoutMs, retryCount, dispatchDepth } =
      _retryState;

    if (failedWorkUnits.length === 0 || retryCount >= MAX_RETRIES) {
      return;
    }

    const followupUnits = lastResults
      .filter(
        (
          result,
        ): result is AgentSpawnStreamingResult & {
          signal: NonNullable<AgentSpawnStreamingResult['signal']>;
        } =>
          result.signal !== null &&
          result.signal.signal === 'needs-role-followup' &&
          result.signal.targetRole !== undefined,
      )
      .slice(0, MAX_DISPATCH_DEPTH - dispatchDepth)
      .map((result) => {
        const targetRole = String(result.signal.targetRole);
        const context = result.signal.context === undefined ? '' : String(result.signal.context);

        if (targetRole === 'spiritmender' && context.length > 0) {
          return workUnitContract.parse({
            role: 'spiritmender',
            filePaths: [context],
          });
        }

        return null;
      })
      .filter((unit): unit is WorkUnit => unit !== null);

    await Promise.all(
      followupUnits.map(async (workUnit) => agentSpawnByRoleBroker({ workUnit, timeoutMs })),
    );

    const retryResults = await agentParallelRunnerBroker({
      workUnits: failedWorkUnits,
      maxConcurrent,
      timeoutMs,
    });

    const nextFailed = failedWorkUnits.filter((_, index) => {
      const result = retryResults[index];
      return result?.signal?.signal !== 'complete';
    });

    return lawbringerPhaseLayerBroker({
      questFilePath,
      onPhaseChange,
      _retryState: {
        failedWorkUnits: nextFailed,
        lastResults: retryResults,
        maxConcurrent,
        timeoutMs,
        retryCount: retryCount + 1,
        dispatchDepth: dispatchDepth + followupUnits.length,
      },
    });
  }

  onPhaseChange({ phase: 'lawbringer' });

  const quest = await questLoadBroker({ questFilePath });

  const completedSteps = quest.steps.filter((step) => step.status === 'complete');

  if (completedSteps.length === 0) {
    return;
  }

  const filePairs = stepToFilePairsTransformer({ steps: completedSteps });

  if (filePairs.length === 0) {
    return;
  }

  const workUnits: WorkUnit[] = filePairs.map((pair) =>
    workUnitContract.parse({
      role: 'lawbringer',
      filePaths: pair.map((filePath) => absoluteFilePathContract.parse(filePath)),
    }),
  );

  const maxConcurrent = maxConcurrentContract.parse(CONCURRENT_LIMIT);
  const timeoutMs = timeoutMsContract.parse(TIMEOUT_MS);

  const results = await agentParallelRunnerBroker({ workUnits, maxConcurrent, timeoutMs });

  const failedWorkUnits = workUnits.filter((_, index) => {
    const result = results[index];
    return result?.signal?.signal !== 'complete';
  });

  return lawbringerPhaseLayerBroker({
    questFilePath,
    onPhaseChange,
    _retryState: {
      failedWorkUnits,
      lastResults: results,
      maxConcurrent,
      timeoutMs,
      retryCount: 0,
      dispatchDepth: 0,
    },
  });
};
