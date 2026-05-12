/**
 * PURPOSE: Defines a branded non-negative integer index marking where the tail-window slice of a chain starts
 *
 * USAGE:
 * tailStartIndexContract.parse(3);
 * // Returns: TailStartIndex branded number — items[0..2] are hidden, items[3..] are visible
 */

import { z } from 'zod';

export const tailStartIndexContract = z.number().int().nonnegative().brand<'TailStartIndex'>();

export type TailStartIndex = z.infer<typeof tailStartIndexContract>;
