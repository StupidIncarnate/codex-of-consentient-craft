/**
 * PURPOSE: Defines the result structure from executing a command
 *
 * USAGE:
 * execResultContract.parse({stdout: 'output', stderr: '', exitCode: 0});
 * // Returns: ExecResult with command output and exit code
 */

import { z } from 'zod';

import { exitCodeContract } from '@dungeonmaster/shared/contracts';

import { stderrContract } from '../stderr/stderr-contract';
import { stdoutContract } from '../stdout/stdout-contract';

export const execResultContract = z.object({
  stdout: stdoutContract,
  stderr: stderrContract,
  exitCode: exitCodeContract,
});

export type ExecResult = z.infer<typeof execResultContract>;
