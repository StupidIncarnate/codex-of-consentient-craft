import { z } from 'zod';
import { exitCodeContract } from '../exit-code/exit-code-contract';

// Contract defines only data properties (functions in Error cause Zod type inference issues)
export const execErrorContract = z.object({
  status: exitCodeContract.optional(),
  stdout: z.instanceof(Buffer).optional(),
  stderr: z.instanceof(Buffer).optional(),
  message: z.string().brand<'ErrorMessage'>(),
  name: z.string().brand<'ErrorName'>(),
});

// TypeScript type adds Error methods via intersection
export type ExecError = z.infer<typeof execErrorContract> &
  Error & {
    status?: z.infer<typeof exitCodeContract>;
    stdout?: Buffer;
    stderr?: Buffer;
  };
