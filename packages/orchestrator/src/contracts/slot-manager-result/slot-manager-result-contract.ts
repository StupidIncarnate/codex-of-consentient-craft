/**
 * PURPOSE: Defines the result type for slot manager orchestration
 *
 * USAGE:
 * slotManagerResultContract.parse({completed: true});
 * // Returns validated SlotManagerResult
 */

import { z } from 'zod';

export const slotManagerResultContract = z.object({
  completed: z.literal(true),
});

export type SlotManagerResult = z.infer<typeof slotManagerResultContract>;
