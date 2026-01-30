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
    // stdin: inherit (Claude CLI requires this - hangs with 'ignore' per GitHub #771)
    // stdout: pipe (we read Claude's streaming output)
    // stderr: inherit (show errors directly to user's terminal)
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  // Handle spawn errors (e.g., command not found)
  childProcess.on('error', (error: Error) => {
    process.stderr.write(`Claude spawn error: ${error.message}\n`);
  });

  // stdout is guaranteed to exist when stdio[1] is 'pipe'
  const { stdout } = childProcess;
  if (stdout === null) {
    throw new Error('Failed to create stdout pipe for Claude process');
  }

  return {
    process: childProcess,
    stdout,
  };
};
