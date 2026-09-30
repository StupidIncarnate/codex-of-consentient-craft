/**
 * PURPOSE: Defines the `data` QuestNewResponder returns on success
 *
 * USAGE:
 * const data = questNewResponseDataContract.parse(value);
 * // Returns validated QuestNewResponseData
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questNewResponseDataContract = z.strictObject({
  questId: questContract.shape.id.optional(),
  chatProcessId: z.string(),
}).brand<'QuestNewResponseData'>();

export type QuestNewResponseData = z.infer<typeof questNewResponseDataContract>;
