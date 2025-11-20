/**
 * PURPOSE: Executes a command synchronously using execSync
 *
 * USAGE:
 * const output = childProcessExecSyncAdapter({command: 'ls -la', options: {cwd: '/tmp'}});
 * // Returns command output as Buffer or FileContent
 */

import { execSync } from 'child_process';
import type { ExecSyncOptions } from 'child_process';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

export const childProcessExecSyncAdapter = ({
  command,
  options,
}: {
  command: string;
  options?: ExecSyncOptions;
}): Buffer | FileContent => {
  const result = execSync(command, options);
  if (Buffer.isBuffer(result)) {
    return result;
  }
  return fileContentContract.parse(result);
};
