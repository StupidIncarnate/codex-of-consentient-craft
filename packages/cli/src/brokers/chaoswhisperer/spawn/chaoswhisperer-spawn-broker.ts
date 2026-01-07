/**
 * PURPOSE: Spawns Claude CLI subprocess with ChaosWhisperer prompt for BDD architecture
 *
 * USAGE:
 * await chaoswhispererSpawnBroker({userInput: UserInputStub({value: 'I need user authentication'})});
 * // Spawns claude subprocess with ChaosWhisperer prompt, returns exit code
 */

import type { ExitCode, UserInput } from '@dungeonmaster/shared/contracts';

import { claudeSpawnBroker } from '../../claude/spawn/claude-spawn-broker';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import { chaoswhispererPromptStatics } from '../../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';

export const chaoswhispererSpawnBroker = async ({
  userInput,
}: {
  userInput: UserInput;
}): Promise<{ exitCode: ExitCode | null }> => {
  // Replace placeholder with user input
  const promptText = chaoswhispererPromptStatics.prompt.template.replace(
    chaoswhispererPromptStatics.prompt.placeholders.arguments,
    userInput,
  );

  const prompt = promptTextContract.parse(promptText);

  return claudeSpawnBroker({ prompt });
};
