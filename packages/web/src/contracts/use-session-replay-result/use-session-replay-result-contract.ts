/**
 * PURPOSE: Defines the data `useSessionReplayBinding` returns
 *
 * USAGE:
 * useSessionReplayResultContract.parse(value);
 * // Returns validated UseSessionReplayResult
 */
import { z } from '#gateway/npm/zod';
import { chatEntryContract } from '@dungeonmaster/shared/contracts';

export const useSessionReplayResultContract = z
  .object({
    entries: z.array(chatEntryContract),
    isLoading: z.boolean(),
    sessionNotFound: z.boolean(),
  })
  .brand<'UseSessionReplayResult'>();

export type UseSessionReplayResult = z.infer<typeof useSessionReplayResultContract>;
