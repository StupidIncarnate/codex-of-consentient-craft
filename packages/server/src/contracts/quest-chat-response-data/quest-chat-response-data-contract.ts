/**
 * PURPOSE: Defines the `data` QuestChatResponder returns on success
 *
 * USAGE:
 * const data = questChatResponseDataContract.parse(value);
 * // Returns validated QuestChatResponseData
 */

import { z } from '#gateway/npm/zod';

export const questChatResponseDataContract = z
  .strictObject({ chatProcessId: z.string().brand<'QuestChatResponseDataChatProcessId'>() })
  .brand<'QuestChatResponseData'>();

export type QuestChatResponseData = z.infer<typeof questChatResponseDataContract>;
