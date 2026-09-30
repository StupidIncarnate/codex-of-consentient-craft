/**
 * PURPOSE: Defines the data `questMcpCreateBroker` returns
 *
 * USAGE:
 * questMcpCreateResultContract.parse(value);
 * // Returns validated QuestMcpCreateResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questMcpCreateResultContract = z
  .object({
    questId: questContract.shape.id,
    guildSlug: z.string().brand<'QuestMcpCreateResultGuildSlug'>(),
  })
  .brand<'QuestMcpCreateResult'>();

export type QuestMcpCreateResult = z.infer<typeof questMcpCreateResultContract>;
