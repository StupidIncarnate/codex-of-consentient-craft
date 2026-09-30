/**
 * PURPOSE: Defines the data `questNewBroker` returns
 *
 * USAGE:
 * questNewResultContract.parse(value);
 * // Returns validated QuestNewResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questNewResultContract = z
  .object({
    questId: questContract.shape.id,
    chatProcessId: z.string().brand<'QuestNewResultChatProcessId'>(),
  })
  .brand<'QuestNewResult'>();

export type QuestNewResult = z.infer<typeof questNewResultContract>;
