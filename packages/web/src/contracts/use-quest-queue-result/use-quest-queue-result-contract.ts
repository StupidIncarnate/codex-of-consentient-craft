/**
 * PURPOSE: Defines the data `useQuestQueueBinding` returns
 *
 * USAGE:
 * useQuestQueueResultContract.parse(value);
 * // Returns validated UseQuestQueueResult
 */
import { z } from '#gateway/npm/zod';
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';

export const useQuestQueueResultContract = z
  .object({
    activeEntry: questQueueEntryContract.nullable(),
    allEntries: z.array(questQueueEntryContract).readonly(),
    errorEntry: questQueueEntryContract.optional(),
    isLoading: z.boolean(),
  })
  .brand<'UseQuestQueueResult'>();

export type UseQuestQueueResult = z.infer<typeof useQuestQueueResultContract>;
