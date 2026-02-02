/**
 * PURPOSE: Spawns Claude CLI with streaming output for PathSeeker file mapping agent
 *
 * USAGE:
 * const result = await pathseekerSpawnStreamingBroker({
 *   questId: QuestIdStub({ value: 'add-auth' }),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { QuestId, SessionId, StepId } from '@dungeonmaster/shared/contracts';

import { cryptoRandomUuidAdapter } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter';
import { agentSpawnStreamingBroker } from '../../agent/spawn-streaming/agent-spawn-streaming-broker';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { pathseekerPromptStatics } from '@dungeonmaster/orchestrator';

export const pathseekerSpawnStreamingBroker = async ({
  questId,
  resumeSessionId,
  timeoutMs,
}: {
  questId: QuestId;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  // Replace placeholder with quest ID
  const promptText = pathseekerPromptStatics.prompt.template.replace(
    pathseekerPromptStatics.prompt.placeholders.arguments,
    `Quest ID: ${questId}`,
  );

  const prompt = promptTextContract.parse(promptText);

  // Generate a step ID for pathseeker since it doesn't receive one
  // Cast through unknown because Uuid and StepId are both branded UUIDs
  const stepId = cryptoRandomUuidAdapter() as unknown as StepId;

  const spawnArgs = resumeSessionId
    ? { prompt, stepId, resumeSessionId, timeoutMs }
    : { prompt, stepId, timeoutMs };

  return agentSpawnStreamingBroker(spawnArgs);
};
