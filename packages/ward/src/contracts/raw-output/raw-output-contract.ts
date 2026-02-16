/**
 * PURPOSE: Defines the raw process output structure with stdout, stderr, and exit code
 *
 * USAGE:
 * rawOutputContract.parse({stdout: 'output', stderr: '', exitCode: 0});
 * // Returns: RawOutput validated object
 */

import { z } from 'zod';

export const rawOutputContract = z.object({
  stdout: z.string().brand<'Stdout'>(),
  stderr: z.string().brand<'Stderr'>(),
  exitCode: z.number().brand<'ExitCode'>(),
});

export type RawOutput = z.infer<typeof rawOutputContract>;
