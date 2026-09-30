/**
 * PURPOSE: Defines the `data` QuestNewResponder returns on success
 *
 * USAGE:
 * const data = questNewResponseDataContract.parse(value);
 * // Returns validated QuestNewResponseData
 */

import { z } from '#gateway/npm/zod';

export const questNewResponseDataContract = z.strictObject({
  questId: z.string().brand<'QuestId'>().optional(),
  chatProcessId: z.string(),
});

export type QuestNewResponseData = z.infer<typeof questNewResponseDataContract>;
