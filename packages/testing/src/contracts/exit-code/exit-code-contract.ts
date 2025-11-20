/**
 * PURPOSE: Defines the exit code returned by a child process
 *
 * USAGE:
 * const exitCode = exitCodeContract.parse(0);
 * // Returns validated ExitCode branded type
 */

import { z } from 'zod';

export const exitCodeContract = z.number().int().brand<'ExitCode'>();

export type ExitCode = z.infer<typeof exitCodeContract>;
