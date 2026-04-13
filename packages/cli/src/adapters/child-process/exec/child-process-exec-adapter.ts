/**
 * PURPOSE: Executes a shell command asynchronously using child_process.exec (fire-and-forget)
 *
 * USAGE:
 * childProcessExecAdapter({ command: 'open http://localhost:3737' });
 * // Spawns the command in a shell without waiting for completion
 */
import { exec } from 'child_process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const childProcessExecAdapter = ({ command }: { command: string }): AdapterResult => {
  exec(command);

  return { success: true as const };
};
