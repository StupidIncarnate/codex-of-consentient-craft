/**
 * PURPOSE: Defines a branded non-negative integer type for counts of entries removed from the execution queue
 *
 * USAGE:
 * removedCountContract.parse(2);
 * // Returns: RemovedCount branded number
 */

import { z } from 'zod';

export const removedCountContract = z.number().int().nonnegative().brand<'RemovedCount'>();

export type RemovedCount = z.infer<typeof removedCountContract>;
