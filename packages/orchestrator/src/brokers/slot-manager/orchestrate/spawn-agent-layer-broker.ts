/**
 * PURPOSE: Spawns an agent for a specific work unit with optional session resume
 *
 * USAGE:
 * const result = await spawnAgentLayerBroker({workUnit, startPath, guildId});
 * // Returns AgentSpawnStreamingResult from the spawned agent
 */

import type { ChatEntry, FilePath, GuildId, SessionId } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { ContinuationContext } from '../../../contracts/continuation-context/continuation-context-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';

export const spawnAgentLayerBroker = async ({
  workUnit,
  resumeSessionId,
  continuationContext,
  startPath,
  guildId,
  onEntries,
  onSessionId,
  abortSignal,
}: {
  workUnit: WorkUnit;
  resumeSessionId?: SessionId;
  continuationContext?: ContinuationContext;
  startPath: FilePath;
  guildId: GuildId;
  onEntries?: (params: { entries: ChatEntry[]; sessionId: SessionId | undefined }) => void;
  onSessionId?: (params: { sessionId: SessionId }) => void;
  abortSignal?: AbortSignal;
}): Promise<AgentSpawnStreamingResult> => {
  const result = await agentSpawnByRoleBroker({
    workUnit,
    startPath,
    guildId,
    ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
    ...(continuationContext === undefined ? {} : { continuationContext }),
    ...(onEntries === undefined ? {} : { onEntries }),
    ...(onSessionId === undefined ? {} : { onSessionId }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });
  return result;
};
