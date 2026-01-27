/**
 * PURPOSE: Spawns Claude CLI with streaming output for implementing quest steps
 *
 * USAGE:
 * const result = await codeweaverSpawnStreamingBroker({
 *   step: DependencyStepStub(),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { DependencyStep, SessionId } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingBroker } from '../../agent/spawn-streaming/agent-spawn-streaming-broker';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { codeweaverPromptStatics } from '../../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { questStatics } from '../../../statics/quest/quest-statics';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';

export const codeweaverSpawnStreamingBroker = async ({
  step,
  resumeSessionId,
  timeoutMs,
}: {
  step: DependencyStep;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  // Format step context as JSON for the prompt
  const stepContext = JSON.stringify(step, null, questStatics.json.indentSpaces);

  // Replace placeholder with step context
  const promptText = codeweaverPromptStatics.prompt.template.replace(
    codeweaverPromptStatics.prompt.placeholders.arguments,
    stepContext,
  );

  const prompt = promptTextContract.parse(promptText);

  // Pass through to agent spawn streaming broker
  const spawnArgs = resumeSessionId
    ? { prompt, stepId: step.id, resumeSessionId, timeoutMs }
    : { prompt, stepId: step.id, timeoutMs };

  return agentSpawnStreamingBroker(spawnArgs);
};
