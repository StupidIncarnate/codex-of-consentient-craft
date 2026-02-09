/**
 * PURPOSE: Spawns Claude CLI with stream-json output format for monitoring agent output
 *
 * USAGE:
 * const { process, stdout } = childProcessSpawnStreamJsonAdapter({
 *   prompt: PromptTextStub({ value: 'Hello' }),
 * });
 * // Returns ChildProcess handle with readable stdout stream
 */

import { spawn, type ChildProcess } from 'child_process';
import type { Readable } from 'stream';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { SessionId } from '@dungeonmaster/shared/contracts';

export interface SpawnStreamJsonResult {
  process: ChildProcess;
  stdout: Readable;
}

export const childProcessSpawnStreamJsonAdapter = ({
  prompt,
  resumeSessionId,
}: {
  prompt: PromptText;
  resumeSessionId?: SessionId;
}): SpawnStreamJsonResult => {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose'];

  if (resumeSessionId) {
    args.push('--resume', resumeSessionId);
  }

  const childProcess = spawn('claude', args, {
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  // stdout is guaranteed to exist when stdio[1] is 'pipe'
  // Using non-null assertion as TypeScript doesn't narrow based on stdio config
  const { stdout } = childProcess;

  return {
    process: childProcess,
    stdout,
  };
};
