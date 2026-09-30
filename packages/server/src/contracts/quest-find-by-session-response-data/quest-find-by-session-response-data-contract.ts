/**
 * PURPOSE: Defines the `data` QuestFindBySessionResponder returns on success
 *
 * USAGE:
 * const data = questFindBySessionResponseDataContract.parse(value);
 * // Returns validated QuestFindBySessionResponseData
 */

import { z } from '#gateway/npm/zod';

export const questFindBySessionResponseDataContract = z.strictObject({
  questId: z.string().brand<'QuestFindBySessionResponseDataQuestId'>(),
}).brand<'QuestFindBySessionResponseData'>();

export type QuestFindBySessionResponseData = z.infer<typeof questFindBySessionResponseDataContract>;
