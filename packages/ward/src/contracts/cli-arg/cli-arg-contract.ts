/**
 * PURPOSE: Defines a branded string type for individual CLI arguments
 *
 * USAGE:
 * cliArgContract.parse('--verbose');
 * // Returns: CliArg branded string
 */

import { z } from 'zod';

export const cliArgContract = z.string().brand<'CliArg'>();

export type CliArg = z.infer<typeof cliArgContract>;
