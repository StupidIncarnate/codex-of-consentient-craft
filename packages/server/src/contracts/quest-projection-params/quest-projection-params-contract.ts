/**
 * PURPOSE: Defines the validated shape for the HTTP route params of the quest-projection endpoint —
 * the questId whose likely execution remainder is being read
 *
 * USAGE:
 * const { questId } = questProjectionParamsContract.parse(params);
 * // Returns: QuestProjectionParams with a branded QuestId
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questProjectionParamsContract = z
  .object({
    questId: questContract.shape.id,
  })
  .brand<'QuestProjectionParams'>();

export type QuestProjectionParams = z.infer<typeof questProjectionParamsContract>;
