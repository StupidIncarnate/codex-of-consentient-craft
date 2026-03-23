/**
 * PURPOSE: Spawns an agent for a specific work unit with optional session resume
 *
 * USAGE:
 * const result = await spawnAgentLayerBroker({workUnit, timeoutMs});
 * // Returns AgentSpawnStreamingResult from the spawned agent
 */

import type { FilePath, SessionId } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { ContinuationContext } from '../../../contracts/continuation-context/continuation-context-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';

export const spawnAgentLayerBroker = async ({
  workUnit,
  resumeSessionId,
  continuationContext,
  timeoutMs,
  startPath,
  onLine,
  onSessionId,
  abortSignal,
}: {
  workUnit: WorkUnit;
  resumeSessionId?: SessionId;
  continuationContext?: ContinuationContext;
  timeoutMs: TimeoutMs;
  startPath: FilePath;
  onLine?: (params: { line: string }) => void;
  onSessionId?: (params: { sessionId: SessionId }) => void;
  abortSignal?: AbortSignal;
}): Promise<AgentSpawnStreamingResult> => {
  const result = await agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    startPath,
    ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
    ...(continuationContext === undefined ? {} : { continuationContext }),
    ...(onLine === undefined ? {} : { onLine }),
    ...(onSessionId === undefined ? {} : { onSessionId }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });
  return result;
};
