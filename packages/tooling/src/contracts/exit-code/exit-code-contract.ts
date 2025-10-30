/**
 * PURPOSE: Defines a branded number type for process exit codes (0-255) with validation.
 *
 * USAGE:
 * const exitCode = exitCodeContract.parse(0);
 * // Returns: ExitCode (branded number between 0 and 255)
 */
import { z } from 'zod';
import { exitCodeStatics } from '../../statics/exit-code/exit-code-statics';

export const exitCodeContract = z
  .number()
  .int()
  .min(0)
  .max(exitCodeStatics.limits.max)
  .brand<'ExitCode'>();

export type ExitCode = z.infer<typeof exitCodeContract>;
