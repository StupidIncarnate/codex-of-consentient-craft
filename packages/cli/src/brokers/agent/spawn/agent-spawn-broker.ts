/**
 * PURPOSE: Spawns Claude CLI subprocess with pathseeker prompt for interactive agent dialogue
 *
 * USAGE:
 * await agentSpawnBroker({userInput: UserInputStub({value: 'Create user auth'})});
 * // Spawns claude subprocess with pathseeker prompt, returns exit code
 */

import { exitCodeContract, type ExitCode, type UserInput } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
import { cliStatics } from '../../../statics/cli/cli-statics';
import { pathseekerPromptStatics } from '../../../statics/pathseeker-prompt/pathseeker-prompt-statics';

export const agentSpawnBroker = async ({
  userInput,
}: {
  userInput: UserInput;
}): Promise<{ exitCode: ExitCode | null }> => {
  // Replace placeholder with user input
  const prompt = pathseekerPromptStatics.prompt.template.replace(
    pathseekerPromptStatics.prompt.placeholders.arguments,
    userInput,
  );

  // Spawn claude CLI from system PATH with inherited stdio for interactive mode
  const child = childProcessSpawnAdapter({
    command: cliStatics.commands.claude,
    args: [prompt],
    options: { stdio: 'inherit' },
  });

  // Return promise that resolves when process exits
  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      // Validate exit code if present, otherwise pass null
      const exitCode = code === null ? null : exitCodeContract.parse(code);
      resolve({ exitCode });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};
