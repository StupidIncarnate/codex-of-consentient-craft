/**
 * PURPOSE: Defines a branded number type for process exit codes
 *
 * USAGE:
 * const code: ExitCode = exitCodeContract.parse(0);
 * // Returns a branded ExitCode number type
 */
import { z } from 'zod';

const MAX_EXIT_CODE = 255;

export const exitCodeContract = z.number().int().min(0).max(MAX_EXIT_CODE).brand<'ExitCode'>();

export type ExitCode = z.infer<typeof exitCodeContract>;
