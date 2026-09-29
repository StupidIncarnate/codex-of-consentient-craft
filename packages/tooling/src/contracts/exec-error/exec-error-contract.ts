/**
 * PURPOSE: Defines an error structure for command execution failures with exit status and output buffers.
 *
 * USAGE:
 * const error = execErrorContract.parse({ status: 1, stdout: buffer, stderr: buffer, message: 'Failed', name: 'ExecError' });
 * // Returns: ExecError (Error object with status, stdout, stderr properties)
 */
import { z } from '#gateway/npm/zod';
import { bufferSchema } from '#gateway/node/buffer';
import { exitCodeContract } from '../exit-code/exit-code-contract';

// Contract defines only data properties (functions in Error cause Zod type inference issues)
export const execErrorContract = z.object({
  status: exitCodeContract.optional(),
  stdout: bufferSchema.optional(),
  stderr: bufferSchema.optional(),
  message: z.string().brand<'ErrorMessage'>(),
  name: z.string().brand<'ErrorName'>(),
});

// TypeScript type adds Error methods via intersection
export type ExecError = z.infer<typeof execErrorContract> &
  Error & {
    status?: z.infer<typeof exitCodeContract>;
  };
