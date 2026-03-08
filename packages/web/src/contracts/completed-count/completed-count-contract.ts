/**
 * PURPOSE: Defines a branded non-negative integer type for completed step counts
 *
 * USAGE:
 * completedCountContract.parse(3);
 * // Returns: CompletedCount branded number
 */

import { z } from 'zod';

export const completedCountContract = z.number().int().nonnegative().brand<'CompletedCount'>();

export type CompletedCount = z.infer<typeof completedCountContract>;
