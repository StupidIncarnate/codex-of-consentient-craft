/**
 * PURPOSE: Defines the status outcome of a check execution
 *
 * USAGE:
 * checkStatusContract.parse('pass');
 * // Returns: CheckStatus branded string
 */

import { z } from 'zod';

export const checkStatusContract = z.enum(['pass', 'fail', 'skip']);

export type CheckStatus = z.infer<typeof checkStatusContract>;
