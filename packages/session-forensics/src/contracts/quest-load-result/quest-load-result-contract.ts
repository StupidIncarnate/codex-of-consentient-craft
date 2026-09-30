/**
 * PURPOSE: Defines the data `questLoadBroker` returns
 *
 * USAGE:
 * questLoadResultContract.parse(value);
 * // Returns validated QuestLoadResult
 */
import { z } from '#gateway/npm/zod';
import { flowContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const questLoadResultContract = z
  .object({
    flows: z.array(flowContract).readonly(),
    workItems: z.array(workItemContract).readonly(),
  })
  .brand<'QuestLoadResult'>();

export type QuestLoadResult = z.infer<typeof questLoadResultContract>;
