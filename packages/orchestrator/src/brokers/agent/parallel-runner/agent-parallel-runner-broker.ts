/**
 * PURPOSE: Runs multiple agent work units in parallel with concurrency control
 *
 * USAGE:
 * const results = await agentParallelRunnerBroker({
 *   workUnits: [WorkUnitStub(), WorkUnitStub()],
 *   maxConcurrent: MaxConcurrentStub({ value: 2 }),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns AgentSpawnStreamingResult[] in same order as input work units
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingResultContract } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { MaxConcurrent } from '../../../contracts/max-concurrent/max-concurrent-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../spawn-by-role/agent-spawn-by-role-broker';

export const agentParallelRunnerBroker = async ({
  workUnits,
  maxConcurrent,
  timeoutMs,
  startPath,
}: {
  workUnits: WorkUnit[];
  maxConcurrent: MaxConcurrent;
  timeoutMs: TimeoutMs;
  startPath: FilePath;
}): Promise<AgentSpawnStreamingResult[]> => {
  if (workUnits.length === 0) {
    return [];
  }

  const crashedResult: AgentSpawnStreamingResult = agentSpawnStreamingResultContract.parse({
    crashed: true,
    timedOut: false,
    signal: null,
    sessionId: null,
    exitCode: null,
  });

  const batchSize = Number(maxConcurrent);
  const batch = workUnits.slice(0, batchSize);
  const remaining = workUnits.slice(batchSize);

  const batchResults = await Promise.allSettled(
    batch.map(async (workUnit) => agentSpawnByRoleBroker({ workUnit, timeoutMs, startPath })),
  );

  const mappedResults = batchResults.map(
    (result): AgentSpawnStreamingResult =>
      result.status === 'fulfilled' ? result.value : crashedResult,
  );

  const remainingResults = await agentParallelRunnerBroker({
    workUnits: remaining,
    maxConcurrent,
    timeoutMs,
    startPath,
  });

  return [...mappedResults, ...remainingResults];
};
