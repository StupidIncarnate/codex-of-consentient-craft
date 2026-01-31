/**
 * PURPOSE: Spawns Claude CLI with streaming output for ChaosWhisperer with tee behavior
 *
 * USAGE:
 * const result = await chaoswhispererSpawnStreamingBroker({
 *   userInput: UserInputStub({ value: 'I need authentication' }),
 * });
 * // Returns { sessionId, signal, exitCode } after user finishes interaction
 * // For needs-user-input signal: returns early with { kill } function to terminate process
 *
 * The broker:
 * 1. Generates a stepId UUID for the session
 * 2. Substitutes $SESSION_ID placeholder in the prompt
 * 3. Spawns Claude with stream-json output
 * 4. Tees output: displays text to user AND captures for signal extraction
 * 5. Returns result when Claude signals completion
 * 6. For needs-user-input: returns early with kill function for cleanup
 */

import type { UserInput, StepId, SessionId } from '@dungeonmaster/shared/contracts';
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

export type ChaoswhispererStreamingResultWithKill = ChaoswhispererStreamingResult & {
  kill?: () => boolean;
};

const SESSION_ID_PLACEHOLDER = '$SESSION_ID';

export const chaoswhispererSpawnStreamingBroker = async ({
  userInput,
  resumeSessionId,
}: {
  userInput: UserInput;
  resumeSessionId?: SessionId;
}): Promise<ChaoswhispererStreamingResultWithKill> => {
  // Generate a stepId for this session
  const uuid = cryptoRandomUuidAdapter();
  const stepId: StepId = stepIdContract.parse(uuid);

  // Build prompt based on whether this is a new session or resume
  // - New session: Full template with user request substituted
  // - Resume: Just the user's answer (Claude already has the conversation context via --resume)
  const prompt =
    resumeSessionId === undefined
      ? promptTextContract.parse(
          chaoswhispererPromptStatics.prompt.template
            .replace(chaoswhispererPromptStatics.prompt.placeholders.arguments, userInput)
            .replace(SESSION_ID_PLACEHOLDER, stepId),
        )
      : promptTextContract.parse(userInput);

  // Spawn claude with stream-json output
  const spawnArgs = resumeSessionId === undefined ? { prompt } : { prompt, resumeSessionId };
  const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter(spawnArgs);

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

  // Warn user when agent exits without signaling (forgot or crashed without calling signal-back)
  // Only warn on successful exit (code 0) - non-zero exit means error already occurred
  if (monitorResult.signal === null && monitorResult.exitCode === 0) {
    process.stderr.write('Warning: Agent ended without signaling completion\n');
  }

  // Build result with validated fields
  const baseResult = chaoswhispererStreamingResultContract.parse({
    sessionId: monitorResult.sessionId,
    signal: monitorResult.signal,
    exitCode: monitorResult.exitCode,
  });

  // Include kill function if provided (for needs-user-input signal)
  return monitorResult.kill === undefined
    ? baseResult
    : { ...baseResult, kill: monitorResult.kill };
};
