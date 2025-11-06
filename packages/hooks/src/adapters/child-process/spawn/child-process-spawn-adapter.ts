/**
 * PURPOSE: Adapter for Node.js child_process.spawn to create child processes
 *
 * USAGE:
 * const childProcess = childProcessSpawnAdapter({ command: 'npm', args: ['test'], options: { stdio: 'inherit' } });
 * // Returns ChildProcess instance
 */
import { spawn } from 'child_process';
import type { SpawnOptions, ChildProcess } from 'child_process';

export const childProcessSpawnAdapter = ({
  command,
  args = [],
  options = {},
}: {
  command: string;
  args?: string[];
  options?: SpawnOptions;
}): ChildProcess => spawn(command, args, options);
