/**
 * PURPOSE: Executes a shell command and returns stdout, stderr, and exit code
 *
 * USAGE:
 * const result = await childProcessExecAdapter({command: 'npm run build', cwd: '/project'});
 * // Returns: {stdout: '...', stderr: '...', exitCode: 0}
 */

import { exec } from 'child_process';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { exitCodeContract } from '@dungeonmaster/shared/contracts';

import type { ExecResult } from '../../../contracts/exec-result/exec-result-contract';
import { stderrContract } from '../../../contracts/stderr/stderr-contract';
import { stdoutContract } from '../../../contracts/stdout/stdout-contract';

export const childProcessExecAdapter = async ({
  command,
  cwd,
}: {
  command: string;
  cwd: AbsoluteFilePath;
}): Promise<ExecResult> =>
  new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error !== null && 'code' in error) {
        resolve({
          stdout: stdoutContract.parse(stdout),
          stderr: stderrContract.parse(stderr),
          exitCode: exitCodeContract.parse(Reflect.get(error, 'code')),
        });
        return;
      }
      if (error !== null) {
        resolve({
          stdout: stdoutContract.parse(''),
          stderr: stderrContract.parse(error.message),
          exitCode: exitCodeContract.parse(1),
        });
        return;
      }
      resolve({
        stdout: stdoutContract.parse(stdout),
        stderr: stderrContract.parse(stderr),
        exitCode: exitCodeContract.parse(0),
      });
    });
  });
