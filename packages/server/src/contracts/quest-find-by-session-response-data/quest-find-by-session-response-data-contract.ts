/**
 * PURPOSE: Defines the `data` QuestFindBySessionResponder returns on success
 *
 * USAGE:
 * const data = questFindBySessionResponseDataContract.parse(value);
 * // Returns validated QuestFindBySessionResponseData
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questFindBySessionResponseDataContract = z.strictObject({
  questId: questContract.shape.id,
}).brand<'QuestFindBySessionResponseData'>();

export type QuestFindBySessionResponseData = z.infer<typeof questFindBySessionResponseDataContract>;
