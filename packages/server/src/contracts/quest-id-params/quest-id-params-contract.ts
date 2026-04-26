/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a questId field
 *
 * USAGE:
 * const { questId } = questIdParamsContract.parse(params);
 * // Returns: QuestIdParams with branded QuestId
 */

import { z } from 'zod';
import { questIdContract } from '@dungeonmaster/shared/contracts';

export const questIdParamsContract = z.object({
  questId: questIdContract,
});

export type QuestIdParams = z.infer<typeof questIdParamsContract>;
