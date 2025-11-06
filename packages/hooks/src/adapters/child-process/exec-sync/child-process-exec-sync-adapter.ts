/**
 * PURPOSE: Adapter for Node.js child_process.execSync with error handling
 *
 * USAGE:
 * const result = childProcessExecSyncAdapter({ command: 'git status', options: { encoding: 'utf8' } });
 * // Returns string or Buffer output from the executed command
 */
import { execSync } from 'child_process';
import type { ExecSyncOptions } from 'child_process';
import type { Buffer } from 'node:buffer';

export const childProcessExecSyncAdapter = ({
  command,
  options,
}: {
  command: string;
  options?: ExecSyncOptions;
}): string | Buffer => {
  try {
    return execSync(command, options);
  } catch (error) {
    throw new Error(`Failed to execute command: ${command}`, { cause: error });
  }
};
