/**
 * PURPOSE: Spawns an agent for a specific work unit with optional session resume
 *
 * USAGE:
 * const result = await spawnAgentLayerBroker({workUnit, timeoutMs});
 * // Returns AgentSpawnStreamingResult from the spawned agent
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';

export const spawnAgentLayerBroker = async ({
  workUnit,
  resumeSessionId,
  timeoutMs,
}: {
  workUnit: WorkUnit;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> =>
  agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
  });
