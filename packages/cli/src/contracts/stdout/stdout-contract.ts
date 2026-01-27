/**
 * PURPOSE: Defines a branded string type for standard output from commands
 *
 * USAGE:
 * stdoutContract.parse('command output');
 * // Returns: 'command output' as Stdout
 */

import { z } from 'zod';

export const stdoutContract = z.string().brand<'Stdout'>();

export type Stdout = z.infer<typeof stdoutContract>;
