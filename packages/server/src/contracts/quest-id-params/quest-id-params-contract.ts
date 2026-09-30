/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a questId field
 *
 * USAGE:
 * const { questId } = questIdParamsContract.parse(params);
 * // Returns: QuestIdParams with branded QuestId
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questIdParamsContract = z.object({
  questId: questContract.shape.id,
});

export type QuestIdParams = z.infer<typeof questIdParamsContract>;
