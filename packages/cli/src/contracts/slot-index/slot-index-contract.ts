/**
 * PURPOSE: Defines a branded non-negative integer type for agent slot indices
 *
 * USAGE:
 * slotIndexContract.parse(0);
 * // Returns: SlotIndex branded number
 */

import { z } from 'zod';

export const slotIndexContract = z.number().int().nonnegative().brand<'SlotIndex'>();

export type SlotIndex = z.infer<typeof slotIndexContract>;
