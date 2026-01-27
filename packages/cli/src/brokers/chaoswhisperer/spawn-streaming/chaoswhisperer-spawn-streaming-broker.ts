/**
 * PURPOSE: Spawns Claude CLI with streaming output for ChaosWhisperer with tee behavior
 *
 * USAGE:
 * const result = await chaoswhispererSpawnStreamingBroker({
 *   userInput: UserInputStub({ value: 'I need authentication' }),
 * });
 * // Returns { sessionId, signal, exitCode } after user finishes interaction
 *
 * The broker:
 * 1. Generates a stepId UUID for the session
 * 2. Substitutes $SESSION_ID placeholder in the prompt
 * 3. Spawns Claude with stream-json output
 * 4. Tees output: displays text to user AND captures for signal extraction
 * 5. Returns result when Claude signals completion
 */

import type { UserInput, StepId } from '@dungeonmaster/shared/contracts';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

import { cryptoRandomUuidAdapter } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter';
import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { chaoswhispererPromptStatics } from '../../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import {
  chaoswhispererStreamingResultContract,
  type ChaoswhispererStreamingResult,
} from '../../../contracts/chaoswhisperer-streaming-result/chaoswhisperer-streaming-result-contract';
import { teeOutputLayerBroker } from './tee-output-layer-broker';

const SESSION_ID_PLACEHOLDER = '$SESSION_ID';

export const chaoswhispererSpawnStreamingBroker = async ({
  userInput,
}: {
  userInput: UserInput;
}): Promise<ChaoswhispererStreamingResult> => {
  // Generate a stepId for this session
  const uuid = cryptoRandomUuidAdapter();
  const stepId: StepId = stepIdContract.parse(uuid);

  // Build prompt from template, replacing both placeholders
  const promptWithArgs = chaoswhispererPromptStatics.prompt.template.replace(
    chaoswhispererPromptStatics.prompt.placeholders.arguments,
    userInput,
  );

  const promptWithSessionId = promptWithArgs.replace(SESSION_ID_PLACEHOLDER, stepId);

  const prompt = promptTextContract.parse(promptWithSessionId);

  // Spawn claude with stream-json output
  const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({ prompt });

  // Wrap ChildProcess to match EventEmittingProcess interface
  const eventEmittingProcess = {
    kill: (): boolean => childProcess.kill(),
    on: (...args: unknown[]): unknown =>
      childProcess.on(...(args as Parameters<typeof childProcess.on>)),
  };

  // Monitor output with tee behavior (display to user + extract signals)
  const monitorResult = await teeOutputLayerBroker({
    stdout,
    process: eventEmittingProcess,
  });

  return chaoswhispererStreamingResultContract.parse({
    sessionId: monitorResult.sessionId,
    signal: monitorResult.signal,
    exitCode: monitorResult.exitCode,
  });
};
