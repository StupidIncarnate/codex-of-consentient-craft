/**
 * PURPOSE: Defines the `data` QuestFollowupStopResponder returns on success
 *
 * USAGE:
 * const data = questFollowupStopResponseDataContract.parse(value);
 * // Returns validated QuestFollowupStopResponseData
 */

import { z } from '#gateway/npm/zod';

export const questFollowupStopResponseDataContract = z
  .strictObject({ stopped: z.boolean() })
  .brand<'QuestFollowupStopResponseData'>();

export type QuestFollowupStopResponseData = z.infer<typeof questFollowupStopResponseDataContract>;
