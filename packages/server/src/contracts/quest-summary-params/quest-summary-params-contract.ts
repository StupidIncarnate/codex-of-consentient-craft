/**
 * PURPOSE: Defines the validated shape for the HTTP route params of the quest-summary endpoint — the
 * questId whose verification state is being read
 *
 * USAGE:
 * const { questId } = questSummaryParamsContract.parse(params);
 * // Returns: QuestSummaryParams with a branded QuestId
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questSummaryParamsContract = z.object({
  questId: questContract.shape.id,
}).brand<'QuestSummaryParams'>();

export type QuestSummaryParams = z.infer<typeof questSummaryParamsContract>;
