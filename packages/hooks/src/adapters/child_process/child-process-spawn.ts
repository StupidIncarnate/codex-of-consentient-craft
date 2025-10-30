/**
 * PURPOSE: Adapter for Node.js child_process.spawn to create child processes
 *
 * USAGE:
 * const childProcess = childProcessSpawn({ command: 'npm', args: ['test'], options: { stdio: 'inherit' } });
 * // Returns ChildProcess instance
 */
import { spawn, type SpawnOptions, type ChildProcess } from 'child_process';

export type { SpawnOptions, ChildProcess };

export const childProcessSpawn = ({
  command,
  args = [],
  options = {},
}: {
  command: string;
  args?: string[];
  options?: SpawnOptions;
}): ChildProcess => spawn(command, args, options);
