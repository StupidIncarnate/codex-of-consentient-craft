/**
 * PURPOSE: Defines the `data` QuestMergeResponder returns on success
 *
 * USAGE:
 * const data = questMergeResponseDataContract.parse(value);
 * // Returns validated QuestMergeResponseData
 */

import { z } from '#gateway/npm/zod';

export const questMergeResponseDataContract = z
  .strictObject({ merging: z.boolean() })
  .brand<'QuestMergeResponseData'>();

export type QuestMergeResponseData = z.infer<typeof questMergeResponseDataContract>;
