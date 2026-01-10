/**
 * PURPOSE: Spawns Claude CLI subprocess with ChaosWhisperer prompt and returns killable process handle
 *
 * USAGE:
 * const process = chaoswhispererSpawnSubprocessBroker({userInput: UserInputStub({value: 'I need auth'})});
 * process.kill();
 * await process.waitForExit();
 * // Returns KillableProcess handle for interactive ChaosWhisperer session
 */

import type { UserInput } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { KillableProcess } from '../../../contracts/killable-process/killable-process-contract';
import { chaoswhispererPromptStatics } from '../../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { cliStatics } from '../../../statics/cli/cli-statics';

export const chaoswhispererSpawnSubprocessBroker = ({
  userInput,
}: {
  userInput: UserInput;
}): KillableProcess => {
  // Build prompt from template
  const promptText = chaoswhispererPromptStatics.prompt.template.replace(
    chaoswhispererPromptStatics.prompt.placeholders.arguments,
    userInput,
  );
  const prompt = promptTextContract.parse(promptText);

  // Spawn claude CLI from system PATH with inherited stdio for interactive mode
  const subprocess = childProcessSpawnAdapter({
    command: cliStatics.commands.claude,
    args: [prompt],
    options: { stdio: 'inherit' },
  });

  // Create exit promise that resolves when subprocess exits
  const exitPromise = new Promise<void>((resolve) => {
    subprocess.on('exit', () => {
      resolve();
    });
    subprocess.on('error', () => {
      resolve();
    });
  });

  // Return killable process handle
  return {
    kill: () => subprocess.kill(),
    waitForExit: async () => exitPromise,
  };
};
