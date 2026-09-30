/**
 * PURPOSE: Defines the data `questStartBroker` returns
 *
 * USAGE:
 * questStartResultContract.parse(value);
 * // Returns validated QuestStartResult
 */
import { z } from '#gateway/npm/zod';

export const questStartResultContract = z
  .object({ processId: z.string().brand<'QuestStartResultProcessId'>() })
  .brand<'QuestStartResult'>();

export type QuestStartResult = z.infer<typeof questStartResultContract>;
