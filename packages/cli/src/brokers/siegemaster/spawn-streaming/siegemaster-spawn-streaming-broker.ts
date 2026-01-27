/**
 * PURPOSE: Spawns Claude CLI with streaming output and Siegemaster prompt for integration testing
 *
 * USAGE:
 * const result = await siegemasterSpawnStreamingBroker({
 *   questId: QuestIdStub({ value: 'add-auth' }),
 *   stepId: StepIdStub(),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { QuestId, SessionId, StepId } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingBroker } from '../../agent/spawn-streaming/agent-spawn-streaming-broker';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { siegemasterPromptStatics } from '../../../statics/siegemaster-prompt/siegemaster-prompt-statics';

export const siegemasterSpawnStreamingBroker = async ({
  questId,
  stepId,
  resumeSessionId,
  timeoutMs,
}: {
  questId: QuestId;
  stepId: StepId;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  // Replace placeholder with quest ID
  const promptText = siegemasterPromptStatics.prompt.template.replace(
    siegemasterPromptStatics.prompt.placeholders.arguments,
    `Quest ID: ${questId}`,
  );

  const prompt = promptTextContract.parse(promptText);

  const spawnArgs = resumeSessionId
    ? { prompt, stepId, resumeSessionId, timeoutMs }
    : { prompt, stepId, timeoutMs };

  return agentSpawnStreamingBroker(spawnArgs);
};
