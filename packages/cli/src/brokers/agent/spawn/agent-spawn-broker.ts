/**
 * PURPOSE: Spawns Claude CLI subprocess with pathseeker prompt for interactive agent dialogue
 *
 * USAGE:
 * await agentSpawnBroker({userInput: UserInputStub({value: 'Create user auth'})});
 * // Spawns claude subprocess with pathseeker prompt, returns exit code
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract, type ExitCode, type UserInput } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
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

  // Find project root to locate node_modules
  const projectRoot = await projectRootFindBroker({
    startPath: filePathContract.parse(__dirname),
  });

  // Locate claude CLI binary in node_modules/.bin
  const claudePath = pathJoinAdapter({
    paths: [projectRoot, 'node_modules', '.bin', 'claude'],
  });

  // Spawn subprocess with inherited stdio for interactive mode
  const child = childProcessSpawnAdapter({
    command: claudePath,
    args: [prompt],
    options: { stdio: 'inherit' },
  });

  // Return promise that resolves when process exits
  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      resolve({ exitCode: code as ExitCode | null });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};
