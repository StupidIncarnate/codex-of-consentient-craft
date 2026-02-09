/**
 * PURPOSE: Spawns Claude CLI subprocess with a given prompt
 *
 * USAGE:
 * await claudeSpawnBroker({prompt: PromptTextStub({value: 'You are an AI...'})});
 * // Spawns claude subprocess with prompt, returns exit code
 */

import { exitCodeContract, type ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import { cliStatics } from '../../../statics/cli/cli-statics';

export const claudeSpawnBroker = async ({
  prompt,
}: {
  prompt: PromptText;
}): Promise<{ exitCode: ExitCode | null }> => {
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
