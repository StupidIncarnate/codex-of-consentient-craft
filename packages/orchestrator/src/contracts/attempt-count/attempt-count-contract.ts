/**
 * PURPOSE: Defines a branded non-negative integer type for retry attempt counts
 *
 * USAGE:
 * attemptCountContract.parse(0);
 * // Returns: AttemptCount branded number
 */

import { z } from 'zod';

export const attemptCountContract = z.number().int().nonnegative().brand<'AttemptCount'>();

export type AttemptCount = z.infer<typeof attemptCountContract>;
