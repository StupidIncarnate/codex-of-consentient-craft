/**
 * PURPOSE: Spawns Claude CLI with streaming output for Lawbringer code review agent
 *
 * USAGE:
 * const result = await lawbringerSpawnStreamingBroker({
 *   workUnit: FilePairWorkUnitStub(),
 *   stepId: StepIdStub(),
 *   timeoutMs: TimeoutMsStub({ value: 60000 }),
 * });
 * // Returns { sessionId, exitCode, signal, crashed, timedOut }
 */

import type { SessionId, StepId } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingBroker } from '../../agent/spawn-streaming/agent-spawn-streaming-broker';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { lawbringerPromptStatics } from '../../../statics/lawbringer-prompt/lawbringer-prompt-statics';
import type { FilePairWorkUnit } from '../../../contracts/file-pair-work-unit/file-pair-work-unit-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { AgentSpawnStreamingResult } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result-contract';

export const lawbringerSpawnStreamingBroker = async ({
  workUnit,
  stepId,
  resumeSessionId,
  timeoutMs,
}: {
  workUnit: FilePairWorkUnit;
  stepId: StepId;
  resumeSessionId?: SessionId;
  timeoutMs: TimeoutMs;
}): Promise<AgentSpawnStreamingResult> => {
  // Build review context from file pair
  const reviewContext = `Implementation file: ${workUnit.implPath}\nTest file: ${workUnit.testPath}`;

  // Replace placeholder with review context
  const promptText = lawbringerPromptStatics.prompt.template.replace(
    lawbringerPromptStatics.prompt.placeholders.arguments,
    reviewContext,
  );

  const prompt = promptTextContract.parse(promptText);

  // Build args conditionally to satisfy exactOptionalPropertyTypes
  const spawnArgs = resumeSessionId
    ? { prompt, stepId, resumeSessionId, timeoutMs }
    : { prompt, stepId, timeoutMs };

  return agentSpawnStreamingBroker(spawnArgs);
};
