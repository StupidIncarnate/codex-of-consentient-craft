/**
 * PURPOSE: Defines the `data` QuestClarifyResponder returns on success
 *
 * USAGE:
 * const data = questClarifyResponseDataContract.parse(value);
 * // Returns validated QuestClarifyResponseData
 */

import { z } from '#gateway/npm/zod';

export const questClarifyResponseDataContract = z
  .strictObject({ chatProcessId: z.string().brand<'QuestClarifyResponseDataChatProcessId'>() })
  .brand<'QuestClarifyResponseData'>();

export type QuestClarifyResponseData = z.infer<typeof questClarifyResponseDataContract>;
