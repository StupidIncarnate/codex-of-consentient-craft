/**
 * PURPOSE: Executes a shell command asynchronously using child_process.exec (fire-and-forget)
 *
 * USAGE:
 * childProcessExecAdapter({ command: 'open http://localhost:3737' });
 * // Spawns the command in a shell without waiting for completion
 */
import { exec } from 'child_process';

export const childProcessExecAdapter = ({ command }: { command: string }): void => {
  exec(command);
};
