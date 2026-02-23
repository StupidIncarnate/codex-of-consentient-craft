/**
 * PURPOSE: Wraps Node.js child_process.spawn for mockability in tests
 *
 * USAGE:
 * const child = childProcessSpawnAdapter({ command: 'claude', args: ['-p', 'hello'], cwd: '/project' });
 * // Returns ChildProcess with stdout/stderr pipes
 */

import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

export const childProcessSpawnAdapter = ({
  command,
  args,
  cwd,
}: {
  command: string;
  args: string[];
  cwd: string;
}): ChildProcess =>
  spawn(command, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'inherit'],
  });
