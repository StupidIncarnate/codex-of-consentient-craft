/**
 * PURPOSE: Defines a branded string type for standard error from commands
 *
 * USAGE:
 * stderrContract.parse('error output');
 * // Returns: 'error output' as Stderr
 */

import { z } from 'zod';

export const stderrContract = z.string().brand<'Stderr'>();

export type Stderr = z.infer<typeof stderrContract>;
