/**
 * PURPOSE: Defines a branded string type for process output (stdout/stderr) with validation.
 *
 * USAGE:
 * const output = processOutputContract.parse('command output');
 * // Returns: ProcessOutput (branded string)
 */
import { z } from 'zod';

export const processOutputContract = z.string().brand<'ProcessOutput'>();

export type ProcessOutput = z.infer<typeof processOutputContract>;
