/**
 * PURPOSE: Defines a branded non-negative integer type for total step counts
 *
 * USAGE:
 * totalCountContract.parse(8);
 * // Returns: TotalCount branded number
 */

import { z } from 'zod';

export const totalCountContract = z.number().int().nonnegative().brand<'TotalCount'>();

export type TotalCount = z.infer<typeof totalCountContract>;
