/**
 * PURPOSE: Runs siegemaster agents to verify observables, one per observable
 *
 * USAGE:
 * await siegemasterPhaseLayerBroker({
 *   questId: QuestIdStub(),
 *   questFilePath: FilePathStub({ value: '/quests/quest.json' }),
 *   onPhaseChange: ({ phase }) => {},
 * });
 * // Returns void after all observables are verified or skipped
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { maxConcurrentContract } from '../../../contracts/max-concurrent/max-concurrent-contract';
import type { MaxConcurrent } from '../../../contracts/max-concurrent/max-concurrent-contract';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { agentParallelRunnerBroker } from '../../agent/parallel-runner/agent-parallel-runner-broker';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const MAX_RETRIES = 2;
const MAX_DISPATCH_DEPTH = 3;
const CONCURRENT_LIMIT = 3;
const TIMEOUT_MS = 300000;

export const siegemasterPhaseLayerBroker = async ({
  questId,
  questFilePath,
  onPhaseChange,
  _retryState,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  onPhaseChange: ({ phase }: { phase: OrchestrationPhase }) => void;
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

    return siegemasterPhaseLayerBroker({
      questId,
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

  onPhaseChange({ phase: 'siegemaster' });

  const quest = await questLoadBroker({ questFilePath });

  if (quest.observables.length === 0) {
    return;
  }

  const contextMap = new Map(quest.contexts.map((context) => [context.id, context]));

  const workUnits: WorkUnit[] = quest.observables.map((observable) => {
    const matchingContext = contextMap.get(observable.contextId);
    const contexts = matchingContext === undefined ? [] : [matchingContext];

    return workUnitContract.parse({
      role: 'siegemaster',
      questId,
      observables: [observable],
      contexts,
    });
  });

  const maxConcurrent = maxConcurrentContract.parse(CONCURRENT_LIMIT);
  const timeoutMs = timeoutMsContract.parse(TIMEOUT_MS);

  const results = await agentParallelRunnerBroker({ workUnits, maxConcurrent, timeoutMs });

  const failedWorkUnits = workUnits.filter((_, index) => {
    const result = results[index];
    return result?.signal?.signal !== 'complete';
  });

  return siegemasterPhaseLayerBroker({
    questId,
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
