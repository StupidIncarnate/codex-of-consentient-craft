/**
 * PURPOSE: Defines a branded non-negative integer type for slot counts
 *
 * USAGE:
 * const count: SlotCount = slotCountContract.parse(5);
 * // Returns a branded SlotCount integer (0 or positive)
 */

import { z } from 'zod';

export const slotCountContract = z.number().int().nonnegative().brand<'SlotCount'>();

export type SlotCount = z.infer<typeof slotCountContract>;
