/**
 * PURPOSE: Defines the data `questResolveQuestsPathBroker` returns
 *
 * USAGE:
 * questResolveQuestsPathResultContract.parse(value);
 * // Returns validated QuestResolveQuestsPathResult
 */
import { z } from '#gateway/npm/zod';

export const questResolveQuestsPathResultContract = z
  .object({ questsPath: z.string().brand<'QuestResolveQuestsPathResultQuestsPath'>() })
  .brand<'QuestResolveQuestsPathResult'>();

export type QuestResolveQuestsPathResult = z.infer<typeof questResolveQuestsPathResultContract>;
