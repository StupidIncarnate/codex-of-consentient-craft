/**
 * PURPOSE: Spawns Claude CLI subprocess with a given prompt
 *
 * USAGE:
 * await claudeSpawnBroker({prompt: PromptTextStub({value: 'You are an AI...'})});
 * // Spawns claude subprocess with prompt, returns exit code
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';
import { exitCodeContract, filePathContract, type ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';

export const claudeSpawnBroker = async ({
  prompt,
}: {
  prompt: PromptText;
}): Promise<{ exitCode: ExitCode | null }> => {
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
      // Validate exit code if present, otherwise pass null
      const exitCode = code === null ? null : exitCodeContract.parse(code);
      resolve({ exitCode });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};
