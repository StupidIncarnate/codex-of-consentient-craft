/**
 * PURPOSE: Defines the data `useQuestProjectionBinding` returns
 *
 * USAGE:
 * useQuestProjectionResultContract.parse(value);
 * // Returns validated UseQuestProjectionResult
 */
import { z } from '#gateway/npm/zod';
import { questProjectionContract } from '@dungeonmaster/shared/contracts';
import { errorSchema } from '#gateway/browser/Error';

export const useQuestProjectionResultContract = z
  .object({
    data: questProjectionContract.nullable(),
    loading: z.boolean(),
    error: errorSchema.nullable(),
  })
  .brand<'UseQuestProjectionResult'>();

export type UseQuestProjectionResult = z.infer<typeof useQuestProjectionResultContract>;
