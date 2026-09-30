/**
 * PURPOSE: Defines the `data` QuestAbandonResponder returns on success
 *
 * USAGE:
 * const data = questAbandonResponseDataContract.parse(value);
 * // Returns validated QuestAbandonResponseData
 */

import { z } from '#gateway/npm/zod';

export const questAbandonResponseDataContract = z
  .strictObject({ abandoned: z.boolean() })
  .brand<'QuestAbandonResponseData'>();

export type QuestAbandonResponseData = z.infer<typeof questAbandonResponseDataContract>;
