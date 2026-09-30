/**
 * PURPOSE: Defines the data `questRecordParseLayerBroker` returns
 *
 * USAGE:
 * questRecordParseLayerResultContract.parse(value);
 * // Returns validated QuestRecordParseLayerResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questRecordParseLayerResultContract = z
  .object({
    quest: questContract.nullable(),
    blocked: z.string().brand<'QuestRecordParseLayerResultBlocked'>().nullable(),
  })
  .brand<'QuestRecordParseLayerResult'>();

export type QuestRecordParseLayerResult = z.infer<typeof questRecordParseLayerResultContract>;
