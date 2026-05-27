/**
 * PURPOSE: Defines a branded non-negative integer for tracking how many dispatch iterations
 * a recursive driver has executed
 *
 * USAGE:
 * dispatchCountContract.parse(0);
 * // Returns: DispatchCount branded number
 */

import { z } from 'zod';

export const dispatchCountContract = z.number().int().nonnegative().brand<'DispatchCount'>();

export type DispatchCount = z.infer<typeof dispatchCountContract>;
