/**
 * PURPOSE: Defines the data `questIndexLoadBroker` returns
 *
 * USAGE:
 * questIndexLoadResultContract.parse(value);
 * // Returns validated QuestIndexLoadResult
 */
import { z } from '#gateway/npm/zod';
import {
  workItemContract,
  operationItemContract,
  wardResultContract,
  riftcarverResultContract,
} from '@dungeonmaster/shared/contracts';

export const questIndexLoadResultContract = z
  .object({
    userRequest: z.string().brand<'QuestIndexLoadResultUserRequest'>().optional(),
    workItems: z.array(workItemContract).readonly(),
    operations: z.array(operationItemContract).readonly(),
    wardResults: z.array(wardResultContract).readonly(),
    riftcarverResults: z.array(riftcarverResultContract).readonly(),
  })
  .brand<'QuestIndexLoadResult'>();

export type QuestIndexLoadResult = z.infer<typeof questIndexLoadResultContract>;
