/**
 * PURPOSE: Defines the data `questFindQuestPathBroker` returns
 *
 * USAGE:
 * questFindQuestPathResultContract.parse(value);
 * // Returns validated QuestFindQuestPathResult
 */
import { z } from '#gateway/npm/zod';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const questFindQuestPathResultContract = z
  .object({
    questPath: z.string().brand<'QuestFindQuestPathResultQuestPath'>(),
    guildId: guildContract.shape.id,
  })
  .brand<'QuestFindQuestPathResult'>();

export type QuestFindQuestPathResult = z.infer<typeof questFindQuestPathResultContract>;
