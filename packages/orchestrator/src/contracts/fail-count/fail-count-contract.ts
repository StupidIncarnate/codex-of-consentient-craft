/**
 * PURPOSE: Defines a branded non-negative integer type for failure counts
 *
 * USAGE:
 * failCountContract.parse(2);
 * // Returns: FailCount branded number
 */

import { z } from 'zod';

export const failCountContract = z.number().int().nonnegative().brand<'FailCount'>();

export type FailCount = z.infer<typeof failCountContract>;
