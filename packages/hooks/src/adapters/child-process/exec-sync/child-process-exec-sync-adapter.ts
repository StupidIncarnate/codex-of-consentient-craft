/**
 * PURPOSE: Adapter for Node.js child_process.execSync with error handling
 *
 * USAGE:
 * const result = childProcessExecSyncAdapter({ command: 'git status', options: { encoding: 'utf8' } });
 * // Returns CommandOutput from the executed command
 */
import { execSync } from 'child_process';
import type { ExecSyncOptions } from 'child_process';
import { commandOutputContract } from '../../../contracts/command-output/command-output-contract';
import type { CommandOutput } from '../../../contracts/command-output/command-output-contract';

export const childProcessExecSyncAdapter = ({
  command,
  options,
}: {
  command: string;
  options?: ExecSyncOptions;
}): CommandOutput => {
  try {
    const output = execSync(command, options);
    return commandOutputContract.parse(String(output));
  } catch (error) {
    throw new Error(`Failed to execute command: ${command}`, { cause: error });
  }
};
