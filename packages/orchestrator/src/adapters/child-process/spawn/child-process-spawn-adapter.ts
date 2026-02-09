/**
 * PURPOSE: Wraps Node.js child_process.spawn for spawning subprocesses
 *
 * USAGE:
 * import {childProcessSpawnAdapter} from './child-process-spawn-adapter';
 * const child = childProcessSpawnAdapter({
 *   command: 'claude',
 *   args: ['--help'],
 *   options: { stdio: 'inherit' }
 * });
 * // Returns ChildProcess handle
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
