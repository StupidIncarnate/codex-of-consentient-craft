/**
 * PURPOSE: Spawns an agent for a specific step with optional session resume
 *
 * USAGE:
 * const result = await spawnAgentLayerBroker({prompt, stepId, timeoutMs});
 * // Returns AgentSpawnStreamingResult from the spawned agent
 */

import type { SessionId, StepId } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { agentSpawnStreamingBroker } from '../../agent/spawn-streaming/agent-spawn-streaming-broker';

export const spawnAgentLayerBroker = async ({
  prompt,
  stepId,
  resumeSessionId,
  timeoutMs,
}: {
  prompt: PromptText;
  stepId: StepId;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> =>
  agentSpawnStreamingBroker({
    prompt,
    stepId,
    timeoutMs,
    ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
  });
