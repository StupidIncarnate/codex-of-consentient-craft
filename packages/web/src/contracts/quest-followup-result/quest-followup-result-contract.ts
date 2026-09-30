/**
 * PURPOSE: Defines the data `questFollowupBroker` returns
 *
 * USAGE:
 * questFollowupResultContract.parse(value);
 * // Returns validated QuestFollowupResult
 */
import { z } from '#gateway/npm/zod';

export const questFollowupResultContract = z
  .object({ chatProcessId: z.string().brand<'QuestFollowupResultChatProcessId'>() })
  .brand<'QuestFollowupResult'>();

export type QuestFollowupResult = z.infer<typeof questFollowupResultContract>;
