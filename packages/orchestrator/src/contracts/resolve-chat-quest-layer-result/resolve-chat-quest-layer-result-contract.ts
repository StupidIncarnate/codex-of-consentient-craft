/**
 * PURPOSE: Defines the data `resolveChatQuestLayerBroker` returns
 *
 * USAGE:
 * resolveChatQuestLayerResultContract.parse(value);
 * // Returns validated ResolveChatQuestLayerResult
 */
import { z } from '#gateway/npm/zod';
import { questContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const resolveChatQuestLayerResultContract = z
  .object({
    questId: questContract.shape.id,
    workItemId: workItemContract.shape.id,
    createdQuest: z.boolean(),
  })
  .brand<'ResolveChatQuestLayerResult'>();

export type ResolveChatQuestLayerResult = z.infer<typeof resolveChatQuestLayerResultContract>;
