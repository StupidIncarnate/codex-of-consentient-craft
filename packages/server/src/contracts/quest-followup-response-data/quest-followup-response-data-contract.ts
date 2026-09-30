/**
 * PURPOSE: Defines the `data` QuestFollowupResponder returns on success
 *
 * USAGE:
 * const data = questFollowupResponseDataContract.parse(value);
 * // Returns validated QuestFollowupResponseData
 */

import { z } from '#gateway/npm/zod';

export const questFollowupResponseDataContract = z
  .strictObject({ chatProcessId: z.string().brand<'QuestFollowupResponseDataChatProcessId'>() })
  .brand<'QuestFollowupResponseData'>();

export type QuestFollowupResponseData = z.infer<typeof questFollowupResponseDataContract>;
