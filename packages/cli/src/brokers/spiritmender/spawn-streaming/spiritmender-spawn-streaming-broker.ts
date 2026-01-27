/**
 * PURPOSE: Spawns Claude CLI with streaming output for Spiritmender error resolution
 *
 * USAGE:
 * const result = await spiritmenderSpawnStreamingBroker({
 *   workUnit: FileWorkUnitStub(),
 *   stepId: StepIdStub(),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { SessionId, StepId } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingBroker } from '../../agent/spawn-streaming/agent-spawn-streaming-broker';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { spiritmenderPromptStatics } from '../../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import type { FileWorkUnit } from '../../../contracts/file-work-unit/file-work-unit-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';

export const spiritmenderSpawnStreamingBroker = async ({
  workUnit,
  stepId,
  resumeSessionId,
  timeoutMs,
}: {
  workUnit: FileWorkUnit;
  stepId: StepId;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  // Format the work unit as error context
  const errorContext = `File: ${workUnit.filePath}\nErrors:\n${workUnit.errors.map((e) => `- ${e}`).join('\n')}`;

  // Replace placeholder with error context
  const promptText = spiritmenderPromptStatics.prompt.template.replace(
    spiritmenderPromptStatics.prompt.placeholders.arguments,
    errorContext,
  );

  const prompt = promptTextContract.parse(promptText);

  // Build args conditionally to avoid passing undefined with exactOptionalPropertyTypes
  const spawnArgs = resumeSessionId
    ? { prompt, stepId, resumeSessionId, timeoutMs }
    : { prompt, stepId, timeoutMs };

  return agentSpawnStreamingBroker(spawnArgs);
};
