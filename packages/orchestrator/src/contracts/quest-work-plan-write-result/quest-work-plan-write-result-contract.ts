/**
 * PURPOSE: Defines the data `questWorkPlanWriteBroker` returns
 *
 * USAGE:
 * questWorkPlanWriteResultContract.parse(value);
 * // Returns validated QuestWorkPlanWriteResult
 */
import { z } from '#gateway/npm/zod';
import { operationItemContract } from '@dungeonmaster/shared/contracts';

export const questWorkPlanWriteResultContract = z
  .object({ operationItemId: operationItemContract.shape.id })
  .brand<'QuestWorkPlanWriteResult'>();

export type QuestWorkPlanWriteResult = z.infer<typeof questWorkPlanWriteResultContract>;
