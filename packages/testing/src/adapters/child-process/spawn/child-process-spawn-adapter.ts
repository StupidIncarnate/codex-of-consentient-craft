/**
 * PURPOSE: Wraps Node.js child_process.spawn for spawning subprocesses in E2E tests
 *
 * USAGE:
 * import { childProcessSpawnAdapter } from './child-process-spawn-adapter';
 * const child = childProcessSpawnAdapter({
 *   command: 'npx',
 *   args: ['tsx', 'start-cli.ts'],
 *   options: { cwd: '/tmp/test-project', stdio: 'pipe' }
 * });
 */

import { spawn, type ChildProcess, type SpawnOptions } from 'child_process';

export const childProcessSpawnAdapter = ({
  command,
  args,
  options,
}: {
  command: string;
  args: string[];
  options?: SpawnOptions;
}): ChildProcess => {
  if (options) {
    return spawn(command, args, options);
  }
  return spawn(command, args);
};
