/**
 * PURPOSE: Validates command execution result with stdout, stderr, and exit code
 *
 * USAGE:
 * import {execResultContract} from './exec-result-contract';
 * const result = execResultContract.parse({stdout: 'output', stderr: '', exitCode: 0});
 * // Returns validated ExecResult type
 */

import { z } from '#gateway/npm/zod';

export const execResultContract = z.object({
  stdout: z.string().brand<'Stdout'>(),
  stderr: z.string().brand<'Stderr'>(),
  exitCode: z.number().int().brand<'ExecResultExitCode'>(),
}).brand<'ExecResult'>();

export type ExecResult = z.infer<typeof execResultContract>;
