/**
 * PURPOSE: Defines a branded non-negative integer type for deleted-quest counts returned from bulk-clear brokers
 *
 * USAGE:
 * deletedCountContract.parse(3);
 * // Returns: DeletedCount branded number
 */

import { z } from 'zod';

export const deletedCountContract = z.number().int().nonnegative().brand<'DeletedCount'>();

export type DeletedCount = z.infer<typeof deletedCountContract>;
