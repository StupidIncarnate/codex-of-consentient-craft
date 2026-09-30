/**
 * PURPOSE: Defines the data `questChatBroker` returns
 *
 * USAGE:
 * questChatResultContract.parse(value);
 * // Returns validated QuestChatResult
 */
import { z } from '#gateway/npm/zod';

export const questChatResultContract = z
  .object({ chatProcessId: z.string().brand<'QuestChatResultChatProcessId'>() })
  .brand<'QuestChatResult'>();

export type QuestChatResult = z.infer<typeof questChatResultContract>;
