/**
 * PURPOSE: Defines the data `smoketestClearPriorQuestsBroker` returns
 *
 * USAGE:
 * smoketestClearPriorQuestsResultContract.parse(value);
 * // Returns validated SmoketestClearPriorQuestsResult
 */
import { z } from '#gateway/npm/zod';

export const smoketestClearPriorQuestsResultContract = z
  .object({ deletedCount: z.number().brand<'SmoketestClearPriorQuestsResultDeletedCount'>() })
  .brand<'SmoketestClearPriorQuestsResult'>();

export type SmoketestClearPriorQuestsResult = z.infer<
  typeof smoketestClearPriorQuestsResultContract
>;
