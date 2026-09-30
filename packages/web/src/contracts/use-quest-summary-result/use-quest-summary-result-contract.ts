/**
 * PURPOSE: Defines the data `useQuestSummaryBinding` returns
 *
 * USAGE:
 * useQuestSummaryResultContract.parse(value);
 * // Returns validated UseQuestSummaryResult
 */
import { z } from '#gateway/npm/zod';
import { questSummaryContract } from '@dungeonmaster/shared/contracts';
import { errorSchema } from '#gateway/browser/Error';

export const useQuestSummaryResultContract = z
  .object({
    data: questSummaryContract.nullable(),
    loading: z.boolean(),
    error: errorSchema.nullable(),
  })
  .brand<'UseQuestSummaryResult'>();

export type UseQuestSummaryResult = z.infer<typeof useQuestSummaryResultContract>;
