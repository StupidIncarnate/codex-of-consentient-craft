/**
 * PURPOSE: Defines the data `QuestMcpCreateResponder` returns
 *
 * USAGE:
 * questMcpCreateResponderResultContract.parse(value);
 * // Returns validated QuestMcpCreateResponderResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questMcpCreateResponderResultContract = z
  .object({
    questId: questContract.shape.id,
    guildSlug: z.string().brand<'QuestMcpCreateResponderResultGuildSlug'>(),
  })
  .brand<'QuestMcpCreateResponderResult'>();

export type QuestMcpCreateResponderResult = z.infer<typeof questMcpCreateResponderResultContract>;
