/**
 * PURPOSE: Defines the output (stdout/stderr) from a child process
 *
 * USAGE:
 * const output = processOutputContract.parse('test output');
 * // Returns validated ProcessOutput branded type
 */

import { z } from 'zod';

export const processOutputContract = z.string().brand<'ProcessOutput'>();

export type ProcessOutput = z.infer<typeof processOutputContract>;
