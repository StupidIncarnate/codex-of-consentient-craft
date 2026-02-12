/**
 * PURPOSE: Defines a branded non-negative integer type for slot counts
 *
 * USAGE:
 * slotCountContract.parse(3);
 * // Returns: SlotCount branded number
 */

import { z } from 'zod';

export const slotCountContract = z.number().int().nonnegative().brand<'SlotCount'>();

export type SlotCount = z.infer<typeof slotCountContract>;
