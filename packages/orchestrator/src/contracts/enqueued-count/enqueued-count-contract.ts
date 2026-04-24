/**
 * PURPOSE: Defines a branded non-negative integer type for counts of entries enqueued onto the execution queue (e.g., by the first-WS-connect recovery sweep)
 *
 * USAGE:
 * enqueuedCountContract.parse(3);
 * // Returns: EnqueuedCount branded number
 */

import { z } from 'zod';

export const enqueuedCountContract = z.number().int().nonnegative().brand<'EnqueuedCount'>();

export type EnqueuedCount = z.infer<typeof enqueuedCountContract>;
